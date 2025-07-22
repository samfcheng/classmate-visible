<script>
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import { currentUser, pb } from '$lib/pocketbase';
  import { onDestroy, onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';

  import "$lib/styles/edit.scss";

  import Metatags from '$lib/components/Metatags.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import HoverTooltip from '$lib/components/HoverTooltip.svelte';
  import Popup from '$lib/components/Popup.svelte';
  import Loader from '$lib/components/Loader.svelte';

  import { parseString, sanitizeByOriginal } from '$lib/editor_helpers.js';
  import posthog from 'posthog-js';

  import DOMPurify from 'isomorphic-dompurify';
  import { marked } from 'marked'
  import { ChevronsLeft, ArrowLeft, Redo2, Save, Share, LoaderCircle, CircleCheck, Check, ChevronsRight, MessageSquareText, Star, Ellipsis, Sparkle, History, PencilRuler, FileMinus2 } from 'lucide-svelte';
  import autoAnimate from '@formkit/auto-animate';
  import dayjs from 'dayjs';

  let title = "Loading...";
  let result = {};
  let data;
  let essay_content;
  let comments_parent;
  let editor_element;

  let comment_popup = "";
  let comment_popup_shown = false;
  let comment_popup_element;
  let comment_popup_background_element;

  let collapse_tooltip_visible = false;

  let versions_popup = false;
  let versions;

  let marks_archive;

  let overall_feedback_expanded = false;
  let sidebar_collapsed = false;
  let mobile_menu_open = false;

  let resubmit_menu_open = false;
  let resubmit_feedback_focus = "";
  let resubmit_context = "";

  // Event handlers
  let selection_change_event,
      click_event,
      key_up_event,
      scroll_event;

  let highlighted_comment = null;

  const small_comments_breakpoint = 1200;
  let small_comments = [];

  let overall_feedback_wrapper_element;
  let overall_feedback_tooltip_visible = false;

  let resubmit_tooltip_visible = false;

  function positionComments() {
    const marks = document.querySelectorAll('.writing-content mark:not(.resolved)');
    const comments = document.querySelectorAll('.comments .comment:not(.resolved)');
  
    comments.forEach((comment) => {
      comment.style.marginTop = `0px`;
    })
    comments.forEach((comment, index) => {
      comment.addEventListener('click', () => {
        if (highlighted_comment == index) {
          return; // Skip if the comment is already highlighted
        }

        highlight(index); 
      });

      const mark = marks[index]; // Get the corresponding mark element
      if (!mark) return; // Skip if there's no corresponding mark

      const commentRect = comment.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();

      const commentY = commentRect.top + 1.5 * parseFloat(getComputedStyle(comment).fontSize); // Styled based off of rem in css which is based on the font size, so we need to get the font size
      const markY = markRect.top;

      if (commentY < markY) {
        const offset = markY - commentY;
        comment.style.marginTop = `${offset}px`;
      }
    })
  }
  
  function positionSmallComments() {
    const marks = document.querySelectorAll('.writing-content mark:not(.resolved)');
    const comments = result.comments.filter((comment) => comment.resolved !== true);

    const editor_offset = essay_content.getBoundingClientRect().top // Offset off of where the top of the editor is - we can ignore anything above it

    small_comments = []

    let current_group = {
      comments: [],
      top_comment: null,
      top_position: null,
      top_offset: null
    };

    let total_offset = 0;

    comments.forEach((comment, index) => {
      if (current_group.comments.length == 0) {
        const group_mark = marks[index];

        current_group.comments = []
        current_group.top_comment = index
        current_group.top_position = group_mark.getBoundingClientRect().top
        current_group.top_offset = current_group.top_position - editor_offset - total_offset
        total_offset += current_group.top_offset + 1.75 * parseFloat(getComputedStyle(group_mark).fontSize) 
        current_group.comments.push(comment)
      } else {
        const mark = marks[index];

        const mark_position = mark.getBoundingClientRect().top

        if (mark_position < current_group.top_position + 100) {
          current_group.comments.push(comment)
        } else {
          small_comments.push(current_group)

          current_group = { // Resetcurrent group
            comments: [],
            top_comment: null,
            top_position: null,
            top_offset: null,
          };

          current_group.top_comment = index
          current_group.top_position = mark_position
          current_group.top_offset = current_group.top_position - editor_offset - total_offset
          total_offset += current_group.top_offset + 1.75 * parseFloat(getComputedStyle(mark).fontSize) 
          current_group.comments.push(comment)
        }
      }
    })
    small_comments.push(current_group)

    small_comments = small_comments // Update small comments
  }

  onMount(async () => {
    data = await pb.collection('feedback').getOne($page.params.id, {expand: 'user, versions'}) // Get the feedback object

    title = data.title;
    resubmit_feedback_focus = data.focus;
    resubmit_context = data.context;

    // Check for tooltip
    if (!localStorage.getItem("tooltip_tip_collapse")) {
      collapse_tooltip_visible = true;
    }

    //result = parseString(data.commented)
    result = parseString(sanitizeByOriginal(data.content, data.commented))
    if (data.comments) { // If saved coments exist, replace the generated comments with those
      result.comments = data.comments
    }
    if (data.saved_html) { // If saved HTML exists, replace the generated html with that
      result.html = data.saved_html
    }

    if (data.expand?.versions) {
      versions = data.expand.versions.sort((a, b) => new Date(b.created) - new Date(a.created));

      versions.forEach((version) => {
        version.formatted_date = dayjs(version.created).format('M/D/YY h:mm A');
      })
    }

    await tick() // Wait for Svelte to load everything/refresh

    // Get all the mark elements and comments
    const marks = document.querySelectorAll('.writing-content mark:not(.resolved)');
    const comments = document.querySelectorAll('.comments .comment:not(.resolved)');

    selection_change_event = handleSelectionChange
    document.addEventListener("selectionchange", selection_change_event);

    function handleSelectionChange() {
      if (editor_width <= small_comments_breakpoint) {
        return; // Do nothing if small comments are active
      }

      const selection = document.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let node = range.commonAncestorContainer;

      // Ensure selection is inside essay_content
      if (!essay_content.contains(node)) return;

      // Find mark element that contains the cursor
      const markElement = node.nodeType === Node.TEXT_NODE 
        ? node.parentNode.closest("mark") 
        : node.closest("mark");

      if (markElement) {
        // Get all <mark> elements in the document
        const marks = Array.from(document.querySelectorAll("mark:not(.resolved)"));
        
        // Find the index of the current mark
        const markIndex = marks.indexOf(markElement);

        if (markIndex !== -1) {
          highlight(markIndex);
        }
      } else {
        resetHighlight();
      }
    };

    click_event = handleClick
    document.addEventListener("click", click_event)

    function handleClick(event) {
      if (editor_width <= small_comments_breakpoint) {
        return; // Do nothing if small comments are active
      }

      if (event.target.tagName.toLowerCase() == "mark") {
        return;
      }
      if (!event.target.closest(".comments") || event.target == comments_parent) {
        resetHighlight()
      }
    }

    key_up_event = handleKeyUp
    document.addEventListener("keyup", key_up_event)

    marks_archive = Array.from(document.querySelectorAll('.writing-content mark'));
    
    function handleKeyUp() {
      const current_marks = Array.from(document.querySelectorAll('.writing-content mark'));

      if (current_marks.length !== marks_archive.length) {
        const removed_index = marks_archive.findIndex(mark => !current_marks.includes(mark));

        if (removed_index !== -1) {
          resolveComment(removed_index);
        }

        marks_archive = current_marks;
      }
    }

    scroll_event = handleScroll;
    editor_element.addEventListener("scroll", handleScroll)

    function handleScroll() {
      const scrollTop = editor_element.scrollTop;
      comment_popup_element.style.transform = `translate(-50%, calc(-50% + ${scrollTop}px))`;
      comment_popup_background_element.style.transform = `translateY(${scrollTop}px)`;
    }

    comments.forEach((comment, index) => {
      comment.addEventListener('click', () => {
        if (highlighted_comment == index) {
          return; // Skip if the comment is already highlighted
        }

        highlight(index); 
      });
    })

    positionComments()
    positionSmallComments()

    if ($currentUser && !$currentUser.data?.seen_overall_feedback_tooltip) {
      overall_feedback_tooltip_visible = true;

      let stored_data = $currentUser.data || {};
      stored_data.seen_overall_feedback_tooltip = true;
      await pb.collection('users').update($currentUser.id, { data: stored_data });
    } else if ($currentUser && !$currentUser.data?.seen_resubmit_tooltip) {
      resubmit_tooltip_visible = true;

      let stored_data = $currentUser.data || {};
      stored_data.seen_resubmit_tooltip = true;
      await pb.collection('users').update($currentUser.id, { data: stored_data });
    }

    await tick()

    positionComments()
    positionSmallComments()

    if (!overall_feedback_wrapper_element) return;

    const headings = overall_feedback_wrapper_element.querySelectorAll('h3');

    headings.forEach(heading => {
      const text = heading.textContent.trim();

      switch (text) { // oooh fancy switch statement
        case 'Takeaways:':
          heading.classList.add('highlight', 'highlight-blue');
          break;
        case 'What you did well:':
          heading.classList.add('highlight', 'highlight-green');
          break;
        case 'Where you can improve:':
          heading.classList.add('highlight', 'highlight-red');
          break;
      }
    });
  })

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("selectionchange", selection_change_event);
      document.removeEventListener("click", click_event);
      document.removeEventListener("keyup", key_up_event);
      editor_element.removeEventListener("scroll", scroll_event)
    }
  })

  function highlight(index) {
    const marks = document.querySelectorAll('.writing-content mark:not(.resolved)');
    const comments = document.querySelectorAll('.comments .comment:not(.resolved)');

    resetHighlight()

    const text_element = marks[index];
    const comment_element = comments[index];

    text_element.classList.add('highlighted');
    comment_element.classList.add('highlighted');

    highlighted_comment = index;

    const comment = comments[index];
    const mark = marks[index];

    if (!mark || !comments_parent) return; // Skip if no corresponding mark or parent

    const commentRect = comment.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();

    const commentY = commentRect.top + window.scrollY + 1.5 * parseFloat(getComputedStyle(comment).fontSize); // 1.5rem offset
    const markY = markRect.top + window.scrollY

    if (commentY > markY) { // If the comment is below the mark
      const offset = commentY - markY; // Calculate the offset to move the parent

      comments_parent.style.transform = `translateY(-${offset}px)`;
    }

    result.comments[index].expanded = true;

    setTimeout(() => {
      comments_parent.style.transform = `translateY(0px)`

      const new_comments = document.querySelectorAll('.comments .comment:not(.resolved)');
      const new_comment = new_comments[index];
      const new_commentRect = new_comment.getBoundingClientRect();

      const new_commentY = new_commentRect.top + window.scrollY + 1.5 * parseFloat(getComputedStyle(comment).fontSize); // 1.5rem offset

      if (new_commentY > markY) { // If the comment is below the mark
        const offset = new_commentY - markY; // Calculate the offset to move the parent

        comments_parent.style.transform = `translateY(-${offset}px)`;
      }

    }, 1);
  }

  function resetHighlight() {
    const marks = document.querySelectorAll('.writing-content mark:not(.resolved)');
    const comments = document.querySelectorAll('.comments .comment:not(.resolved)');

    if (comments_parent) {
      comments_parent.style.transform = 'translateY(0)';
    }

    if (highlighted_comment !== null) {
      const old_text_element = marks[highlighted_comment];
      const old_comment_element = comments[highlighted_comment];

      old_text_element.classList.remove('highlighted');
      old_comment_element.classList.remove('highlighted');

      result.comments[highlighted_comment].expanded = false

      highlighted_comment = null;
    }
  }

  let width = 1100;
  let editor_width = 1000;
  onMount(async () => {
    width = window.innerWidth;
    editor_width = editor_element.getBoundingClientRect().width;

    if ($currentUser && $currentUser.plan == "edu" && !$currentUser.expand?.institution) {
      console.warn("No institution found; Refreshing...");
      
      const userInfo = await pb.collection('users').getOne($currentUser.id, {expand: 'institution'})
      currentUser.set(userInfo)
    }
  })

  async function resize() {
    width = window.innerWidth;
    editor_width = editor_element.getBoundingClientRect().width;

    resetHighlight();

    if (editor_width > small_comments_breakpoint) {
      positionComments();
    } else {
      positionSmallComments()
    }
  }

  let save_state = "none";
  async function save() {
    save_state = "loading";

    try {
      const updated = await pb.collection('feedback').update(data.id, {
        content: essay_content.innerText,
        saved_html: essay_content.innerHTML,
        comments: result.comments
      })

      data = updated;

      save_state = "saved"
      setTimeout(() => {
        save_state = "none"
      }, 2000)
    } catch (err) {
      console.error(err)
    }
  }

  function viewHistory() {
    versions_popup = true
  }

  async function share() {
    await navigator.share({
      title: title,
      text: 'Check out this Feedback from Classmate!',
      url: window.location.href
    });
  }

  async function resolveComment(comment) {
    const targetComment = result.comments[comment]
    targetComment.resolved = true;

    result.comments = result.comments // Makes #each update

    Array.from(document.querySelectorAll('.writing-content mark'))

    const mark = Array.from(document.querySelectorAll('.writing-content mark')).find(mark => mark.textContent.trim() === targetComment.text.trim());

    if (mark) {
      mark.classList.add('resolved');
    }

    resetHighlight();

    await save();
  }

  function openComment(group) {
    comment_popup_shown = true;
    comment_popup = group
  }

  function openResubmitMenu() {
    resubmit_menu_open = true;
  }
  function setResubmitFocus(type) {
    resubmit_feedback_focus = type;
  }
  async function resubmit() {
    await save()
    
    getFeedback();
  }

  let loading_screen_component;
  let loading = false;

  let error;

  let output,
    general_output,
    generated_title,
    record;

  async function getFeedback() {
    loading = true;

    if (!data.type || !data.content || !resubmit_feedback_focus || !data.id) {
      error = "Something went wrong. Your writing data was not found. Try creating a new doc at classmate.app/new";
      return;
    }

    try {
      loading_screen_component.startLoading();

      posthog.capture('user_attempted_feedback');

      const payload = {
        type: data.type,
        focus: resubmit_feedback_focus,
        context: resubmit_context,
        text: data.content
      };

      const [comment_response, general_response, title_response] = await Promise.all([
        fetch('./../api/comments-gemini/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
        fetch('./../api/general_feedback/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
        fetch('./../api/name_generator/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      ]);

      if (!comment_response.ok) {
        console.log(JSON.stringify(comment_response))
        console.log(comment_response.statusCode)
        throw new Error(`Comment API error: ${comment_response.statusText}`);
      }
      if (!general_response.ok) {
        console.log(JSON.stringify(general_response))
        throw new Error(`General API error: ${general_response.statusText}`);
      }

      output = await comment_response.json();
      general_output = await general_response.json();
      generated_title = await title_response.json();
      

      if (!output || !general_output) {
        error = "There was an issue with generating your feedback"
      }

      record = await pb.collection('feedback').create({
        user: $currentUser.id,
        content: data.content,
        title: data.title,
        context: resubmit_context,
        type: data.type,
        focus: resubmit_feedback_focus,
        commented: output,
        general_feedback: general_output,
        versions: data.versions ? [...data.versions, data.id] : [data.id]
      })

      await pb.collection('feedback').update(data.id, { 
        hidden: true
      })

      loading_screen_component.finishLoading();

      setTimeout(() => {
        if (!error) {
          posthog.capture('user_got_feedback');
          console.log(`Redirecting to /edit/${record.id}...`)
          goto(`/edit/${record.id}`);
          window.location.href = `/edit/${record.id}` // TODO: For some reason, goto isn't working here, so temp fix is using this.
          console.log("Reloading the page...")
          invalidateAll(); // Refresh the page
        }
      }, 1000)
    } catch (err) {
      console.error(err)
      error = err
    }
  }

  async function saveTitle() {
    if (title !== data.title) {
      const new_doc_data = await pb.collection('feedback').update(data.id, {
        title
      })

      data = new_doc_data
    }
  }
</script>

<svelte:window on:resize={resize}/>

{#if title == "Loading..."}
  <Metatags title="Writing Feedback" description="View AI-powered writing feedback on Classmate"/>
{:else}
  <Metatags title={title} description="View AI-powered writing feedback on Classmate"/>
{/if}

<Loader bind:this={loading_screen_component} visible={loading} {error}/>

<Popup bind:visible={resubmit_menu_open} class="no-padding resubmit-popup">
  <header class="resubmit-popup-header">
    <h2 class="popup-title">Get New Feedback</h2>
  </header>
  <div class="resubmit-popup-form">
    <div class="resubmit-form-main">
      <div class="section">
        <h3>Select a Feedback Focus</h3>
        <div class="selector">
          <button class={resubmit_feedback_focus == "Balanced" ? "selector-item selected" : "selector-item"} on:click={() => {setResubmitFocus("Balanced")}}>
            <h4>
              <Star size="16"/>
              <span>Balanced</span>
            </h4>
            {#if data?.focus == "Balanced"}
              <span class="alert">
                Last Used
              </span>
            {/if}
          </button>
          <button class={resubmit_feedback_focus == "Grammar & Spelling" ? "selector-item selected" : "selector-item"} on:click={() => {setResubmitFocus("Grammar & Spelling")}}>
            <h4>
              <PencilRuler size="16"/>
              <span>Grammar & Spelling</span>
            </h4>
            {#if data?.focus == "Grammar & Spelling"}
              <span class="alert">
                Last Used
              </span>
            {/if}
          </button>
          <button class={resubmit_feedback_focus == "Word Reduction" ? "selector-item selected" : "selector-item"} on:click={() => {setResubmitFocus("Word Reduction")}}>
            <h4>
              <FileMinus2 size="16"/>
              <span>Word Reduction</span>
            </h4>
            {#if data?.focus == "Word Reduction"}
              <span class="alert">
                Last Used
              </span>
            {/if}
          </button>
        </div>
      </div>
      <div class="section">
        <h3>Instructions, Rubric, or Context</h3>
        <textarea bind:value={resubmit_context}/>
      </div>
    </div>
    <button class="button" on:click={resubmit}>Resubmit -></button>
  </div>
</Popup>


<main class="editor-main">
  {#if width > 1000}
    <aside class={sidebar_collapsed ? "editor-sidebar collapsed" : "editor-sidebar"}>
      <div class="sidebar-wrapper">
        <div class="sidebar-content">
          <nav class="sidebar-top">
            <a href="../docs" class="sidebar-logo-wrapper">
              <img class="sidebar-logo" src="/logo.svg" alt="logo"/>
            </a>
            {#if $currentUser?.plan == "pro"}
              <HoverTooltip text="You have Classmate Pro" class="small-text" max_width="10rem">
                <span class="pro-badge">Pro</span>
              </HoverTooltip>
            {:else if $currentUser?.plan == "edu"}
              <HoverTooltip text="You have Edu access through {$currentUser?.expand?.institution?.short_name} 🎉" class="small-text" max_width="10rem">
                <span class="pro-badge">
                  {#if $currentUser?.expand?.institution?.short_name}
                    {$currentUser?.expand?.institution?.short_name}
                  {:else}
                    Educational
                  {/if}
                </span>
              </HoverTooltip>
            {:else}
              <a href="../pro" class="pro-button"><Sparkle size="12"/>Get Pro</a>
            {/if}
          </nav>
          <div class="sidebar-sections">
            <div class="sidebar-section overall-feedback">
              <h2>Feedback Overview</h2>
              <div bind:this={overall_feedback_wrapper_element} class={overall_feedback_expanded ? "feedback-content expanded" : "feedback-content"}>
                {#if data?.general_feedback}
                  {@html marked(DOMPurify.sanitize(data.general_feedback))}
                {:else}
                  <p>Loading...</p>
                {/if}

                {#if overall_feedback_expanded}
                  <button class="show-less" on:click={() => {overall_feedback_expanded = false}}>Show Less</button>
                {:else}
                  <button class="expand" on:click={() => {overall_feedback_expanded = true; overall_feedback_tooltip_visible = false}}>... more
                    <Tooltip wrapper={false} text="Click here to expand the feedback overview" x_offset="-1rem" y_offset="0.25rem" indicator_position="85%" visible={overall_feedback_tooltip_visible}/>
                  </button>
                {/if}
              </div>
            </div>
            <div class="sidebar-section sidebar-tools">
              <h2>Tools</h2>
              <div class="tools">
                {#if $currentUser && $currentUser?.id == data?.user}
                  <button on:click={save} disabled={save_state !== "none"}>
                    {#if save_state == "loading"}
                      <LoaderCircle size="16" class="loader-circle"/> Saving...
                    {:else if save_state == "saved"}
                      <CircleCheck size="16"/> Saved!
                    {:else}
                      <Save size="16"/> Save
                    {/if}
                  </button>
                  <Tooltip x_offset="-20%" y_offset="0.25rem" text="💡 TIP: Click to resubmit your writing for new feedback" visible={resubmit_tooltip_visible}>
                    <button on:click={() => {openResubmitMenu(); resubmit_tooltip_visible = false;}}><Redo2 size="16"/> Resubmit</button>
                  </Tooltip>
                {/if}
                {#if versions}
                  <button on:click={viewHistory}><History size="16"/> Versions</button>
                {/if}
                <button on:click={share}><Share size="16"/> Share</button>
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar-bottom">
          <button on:click={() => {goto('/docs')}}><ArrowLeft size="16"/> Documents</button>
          <Tooltip text="💡 TIP: Click to collapse sidebar" visible={collapse_tooltip_visible}>
            <button on:click={() => {sidebar_collapsed = true; setTimeout(() => {collapse_tooltip_visible = false; localStorage.setItem("tooltip_tip_collapse", "shown")}, 1000); setTimeout(() => {resize()}, 1000); setTimeout(() => {resize()}, 1010)}}><ChevronsLeft size="20"/></button>
          </Tooltip>
        </div>
      </div>
    </aside>
    <aside class={sidebar_collapsed ? "collapsed-sidebar" : "collapsed-sidebar hidden"}>
      <div class="logo sidebar-section">
        <a href="../docs" class="sidebar-logo-wrapper">
          <img class="sidebar-logo" src="/logo.svg" alt="logo"/>
        </a>
      </div>
      <div class="sidebar-buttons sidebar-section">
        {#if $currentUser && $currentUser?.id == data?.user}
          <button on:click={save} disabled={save_state !== "none"}>
            {#if save_state == "loading"}
              <LoaderCircle size="20" class="loader-circle"/>
            {:else if save_state == "saved"}
              <CircleCheck size="20"/>
            {:else}
              <Save size="20"/>
            {/if}
          </button>
          <button on:click={openResubmitMenu}><Redo2 size="20"/></button>
        {/if}
        {#if versions}
          <button on:click={viewHistory}><History size="20"/></button>
        {/if}
        <button on:click={share}><Share size="20"/></button>
      </div>
      <div class="sidebar-bottom sidebar-section">
        <button on:click={() => {sidebar_collapsed = false; setTimeout(() => {resize()}, 2000); setTimeout(() => {resize()}, 2010)}} disabled={!sidebar_collapsed}><ChevronsRight size="20"/></button>
      </div>
    </aside>
  {:else}
    <nav class="mobile-nav">
      <a href="../docs" class="nav-logo">
        <img src="/logo.svg" alt="logo"/>
      </a>
      <button class="menu-trigger" on:click={() => {mobile_menu_open = true}}>
        <Ellipsis size="20"/>
      </button>
    </nav>
    <div class={mobile_menu_open ? "mobile-menu-popup" : "mobile-menu-popup hidden"}>
      <button on:click={() => {goto('/docs')}}><ArrowLeft size="16"/> Documents</button>
      <button on:click={save} disabled={save_state !== "none"}>
        {#if save_state == "loading"}
          <LoaderCircle size="16" class="loader-circle"/> Saving...
        {:else if save_state == "saved"}
          <CircleCheck size="16"/> Saved!
        {:else}
          <Save size="16"/> Save
        {/if}
      </button>
      <button on:click={openResubmitMenu}><Redo2 size="16"/> Resubmit</button>
      {#if versions}
          <button on:click={viewHistory}><History size="16"/></button>
        {/if}
      <button on:click={share}><Share size="16"/> Share</button>
    </div>
    <button class={mobile_menu_open ? "mobile-menu-background" : "mobile-menu-background hidden"} on:click={() => {mobile_menu_open = false}}></button>
  {/if}
  <div class="editor-editor" bind:this={editor_element}>
    <div class="editor-wrapper">
      {#if title !== "Loading..."}
        <h1 contenteditable bind:innerText={title} on:focusout={saveTitle}>{title}</h1>
      {:else}
        <h1>
          <span class="title-loading">Lorem Ipsum Dolor</span>
        </h1>
      {/if}
      {#if width <= 1000}
        <div class="editor-general-feedback">
          <h2>Feedback Overview</h2>
          <div class={overall_feedback_expanded ? "feedback-content expanded" : "feedback-content"}>
            {#if data?.general_feedback}
              {@html marked(DOMPurify.sanitize(data.general_feedback))}
            {:else}
              <p>Loading...</p>
            {/if}

            {#if overall_feedback_expanded}
              <button class="show-less" on:click={() => {overall_feedback_expanded = false}}>Show Less</button>
            {:else}
              <button class="expand" on:click={() => {overall_feedback_expanded = true}}>... more</button>
            {/if}
          </div>
        </div>
      {/if}
      <div class="editor-content">
        <div class="editor-content-wrapper">
          {#if result.html}
            <div class="writing-content" contenteditable={$currentUser && $currentUser?.id == data?.user} bind:this={essay_content}>
              {@html result.html}
            </div>
          {:else}
            <div class="writing-content">
              <div class="loading-block">
                <p>
                  <span>
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
                  </span>
                </p>
                <p>
                  <span>
                    It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).
                  </span>
                </p>
                <p>
                  <span>
                    There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.
                  </span>
                </p>
              </div>
            </div>
          {/if}
        </div>
        {#if editor_width > small_comments_breakpoint}
          <aside class="comments" use:autoAnimate bind:this={comments_parent}>
            {#if result.comments}
              {#each result.comments as comment, i}
                {#if !comment.resolved}
                  <div class={comment.resolved ? "comment hidden" : "comment"} tabindex="0" role="button">
                    <div class="comment-header">
                      <div class="info">
                        <div class={`info-img ${comment.type}`}>
                          <img src="/logo.svg" alt="classmate logo"/>
                        </div>
                        <span class="info-type">
                          {#if comment.type == "star"}
                            Star
                          {:else if comment.type == "word-reduction"}
                            Word Reduction
                          {:else if comment.type == "grammar-spelling"}
                            Grammar/Spelling
                          {:else}
                            General Feedback
                          {/if}
                        </span>
                      </div>
                      {#if $currentUser && $currentUser?.id == data?.user}
                        <button class="resolve" aria-label="resolve comment" on:click={() => {resolveComment(i)}}>
                          <Check size="20"/>
                        </button>
                      {/if}
                    </div>
                    <div class={comment.comment.length >= 70 ? "comment-content long-comment" : "comment-content"}>
                      <p class={result.comments[i].expanded ? "expanded" : ""}>
                        {@html marked(DOMPurify.sanitize(comment.comment))}
                      </p>
                      {#if comment.comment.length >= 70}
                        <button class={result.comments[i].expanded ? "show-less" : "show-less hidden"} on:click={() => {result.comments[i].expanded = false}}>Show Less</button>
                        <button class={result.comments[i].expanded ? "expand hidden" : "expand"} on:click={() => {result.comments[i].expanded = true}}>... more</button>
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </aside>
        {:else}
          <div class="small-comments">
            {#if small_comments}
              {#each small_comments as group}
                <button class="comment-trigger" style={`margin-top: ${group.top_offset}px`} on:click={() => {openComment(group)}}>
                  <div class="comment-trigger-preview">
                    {#each group.comments as comment, i}
                      {#if i < 3}
                        <div class={`info-img ${comment.type}`} style={`z-index: ${10 - i}; transform: rotate(${Math.random() > 0.5 ? 4 + Math.random() * 3 : -4 + Math.random() * -3}deg)`}>
                          <MessageSquareText size="12" strokeWidth="1.5"/>
                        </div>
                      {/if}
                    {/each}
                  </div>
                  {group.comments.length}
                </button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="comment-popup-wrapper">
      <div class={comment_popup_shown ? "comment-popup" : "comment-popup hidden"} bind:this={comment_popup_element}>
        {#if comment_popup.comments}
          {#each comment_popup.comments as comment, i}
            <div class="comment">
              <div class="comment-top">
                <div class={`info-img ${comment.type}`}>
                  <img src="/logo.svg" alt="classmate logo"/>
                </div>
                <h3>
                  {#if comment.type == "star"}
                    Star
                  {:else if comment.type == "word-reduction"}
                    Word Reduction
                  {:else if comment.type == "grammar-spelling"}
                    Grammar/Spelling
                  {:else}
                    General Feedback
                  {/if}
                </h3>
              </div>
              <div class={`highlighted-text ${comment.type}`}>
                {#if comment.text.length < 50}
                  {comment.text}
                {:else}
                  {comment.text.slice(0, 47) + '...'}
                {/if}
              </div>
              <div class="comment-content">
                {@html marked(DOMPurify.sanitize(comment.comment))}
              </div>
            </div>
          {/each}
        {/if}
      </div>
      <button class={comment_popup_shown ? "comment-popup-background" : "comment-popup-background hidden"} on:click={() => {comment_popup_shown = false}} bind:this={comment_popup_background_element}></button>
    </div>
  </div>
  <div class="versions-popup-wrapper">
    <div class={versions_popup ? "versions-popup" : "versions-popup hidden"}>
      <h2>Version History</h2>
      <div class="versions">
        {#if versions}
          {#each versions as version}
            <a class="version" data-sveltekit-reload href={`/edit/${version.id}`}>
              <span class="date">{version.formatted_date}</span>
              <span>{version.title}</span>
            </a>
          {/each}
        {/if}
      </div>
    </div>
    <button class={versions_popup ? "versions-popup-background" : "versions-popup-background hidden"} on:click={() => {versions_popup = false}}></button>
  </div>
</main>