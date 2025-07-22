<script>
  import '$lib/styles/new.scss';
  import Navbar from '$lib/components/Navbar.svelte';
  import AuthBlock from '$lib/components/AuthBlock.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Loader from '$lib/components/Loader.svelte';
  import HoverTooltip from '../../lib/components/HoverTooltip.svelte';
  
  import { Info, BookText, GraduationCap, PencilRuler, Mail, FileQuestion, Clipboard, ImageUp, CircleCheck, Star, FileMinus2, Brain } from 'lucide-svelte';

  import { currentUser, pb } from '$lib/pocketbase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import posthog from 'posthog-js';

  let current_step = 1;
  $: max_step = max_step && current_step <= max_step ? max_step : current_step;

  let max_char_length = 7500;

  let writing_type,
      writing_content,
      writing_context = "",
      writing_feedback_focus;

  let loading_screen_component,
      loading = false,
      error = false;

  function stepOne(input) {
    writing_type = input;
    current_step = 2;
  }
  function stepTwo() {
    current_step = 3;
  }
  function stepThree(input) {
    writing_feedback_focus = input;
  }

  let pasted = false;
  async function paste(input) {
    try {
      const text = await navigator.clipboard.readText();

      if (input == "Content") {
        writing_content = text
        pasted = "Content"
      } else if (input == "Context") {
        writing_context = text
        pasted = "Context"
      }

      setTimeout(() => {
        pasted = false
      }, 1000)
    } catch (err) {
      console.error(err)
    }
  }

  onMount(async () => {
    if ($currentUser) {
      // Attempt to update user info

      try {
        const userInfo = await pb.collection('users').getOne($currentUser.id, {expand: 'institution'})
        currentUser.set(userInfo) // Update the writable if the user is changed
      } catch (err) {
        console.error(err);
        pb.authStore.clear(); // Kick the user out if we weren't able to get their new info
      }

      if ($currentUser.plan == "pro" || $currentUser.plan == "edu") {
        max_char_length = 20000;
      }
    }
  })

  let output,
    general_output,
    generated_title,
    record;

  async function getFeedback() {
    loading = true;

    if (!writing_type || !writing_content || !writing_feedback_focus) {
      error = "Please ensure to provide a title, writing type, writing focus, and the content of your writing.";
      return;
    }

    try {
      loading_screen_component.startLoading();

      posthog.capture('user_attempted_feedback');

      const payload = {
        type: writing_type,
        focus: writing_feedback_focus,
        context: writing_context,
        text: writing_content
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
        content: writing_content,
        title: generated_title,
        context: writing_context,
        type: writing_type,
        focus: writing_feedback_focus,
        commented: output,
        general_feedback: general_output
      })

      loading_screen_component.finishLoading();

      setTimeout(() => {
        if (!error) {
          posthog.capture('user_got_feedback');
          goto(`/edit/${record.id}`)
        }
      }, 1000)
    } catch (err) {
      console.error(err)
      error = err
    }
  }
</script>

<Navbar />
<Metatags title="Get Feedback" description="Get personalized feedback on your writing in less than a minute." />

<AuthBlock />

<Loader bind:this={loading_screen_component} visible={loading} {error}/>

<main class="new-main">
  <aside class="sidebar">
    <header>
      <h1>Get Feedback</h1>
      <p>Personalized feedback, in less than a minute.</p>
    </header>
    <div class="steps" style="--current-step: {current_step}">
      <button class={current_step == 1 ? "step selected" : "step"} on:click={() => current_step = 1}>
        <span class="number">1</span>
        <span class="text">Select Feedback Type</span>
      </button>
      <button class={current_step == 2 ? "step selected" : "step"} on:click={() => current_step = 2} disabled={max_step < 2}>
        <span class="number">2</span>
        <span class="text">Paste Writing & Context</span>
      </button>
      <button class={current_step == 3 ? "step selected" : "step"} on:click={() => current_step = 3} disabled={max_step < 3}>
        <span class="number">3</span>
        <span class="text">Select Feedback Focus</span>
      </button>
    </div>
  </aside>
  <div class="form-main" style="--current-step: {current_step}">
    <div class="form-page">
      <div class="page-wrapper">
        <h2>
          <span>What would you like feedback on?</span>
          <HoverTooltip class="info-tooltip extra-padding" text="Select a feedback type — this will help Classmate personalize your feedback to be the best it can." offset={-4} max_width="16rem">
            <Info size="16" />
          </HoverTooltip>
        </h2>
        <div class="selector">
          <div class="selector-group">
            <button class={writing_type == "Academic Essay" ? "selector-item selected" : "selector-item"} on:click={() => {stepOne("Academic Essay")}}>
              <h3>
                <BookText size="16"/>
                <span>Academic Essay</span>
              </h3>
              <p>E.g. APA or MLA Essay</p>
            </button>
            <button class={writing_type == "College Application" ? "selector-item selected" : "selector-item"} on:click={() => {stepOne("College Application")}}>
              <h3>
                <GraduationCap size="16"/>
                <span>College Application</span>
              </h3>
              <p>E.g. Essay like a Why Us? or Personal Statement</p>
            </button>
          </div>
          <button class={writing_type == "Creative Writing" ? "selector-item selected" : "selector-item"} on:click={() => {stepOne("Creative Writing")}}>
            <h3>
              <PencilRuler size="16"/>
              <span>Creative Writing</span>
            </h3>
            <p>E.g. Poem or Screenplay</p>
          </button>
          <button class={writing_type == "Email" ? "selector-item selected" : "selector-item"} on:click={() => {stepOne("Email")}}>
            <h3>
              <Mail size="16"/>
              <span>Email</span>
            </h3>
            <p>A letter or email to someone</p>
          </button>
          <button class={writing_type == "Other" ? "selector-item selected" : "selector-item"} on:click={() => {stepOne("Other")}}>
            <h3>
              <FileQuestion size="16"/>
              <span>Other</span>
            </h3>
            <p>Any other piece of writing</p>
          </button>
        </div>
      </div>
    </div>
    <div class="form-page text-page">
      <div class="page-wrapper">
        <div class="page-section">
          <h2>
            <span>Add your writing content</span>
            <HoverTooltip class="info-tooltip extra-padding" text="Paste in your writing content - the text of your essay or writing." offset={-4} max_width="16rem">
              <Info size="16" />
            </HoverTooltip>
          </h2>
          <div class="text-input-wrapper">
            <textarea bind:value={writing_content} name="content" placeholder="Type here..."></textarea>
            <div class="input-other-options">
              <span>or</span>
              <button class="simple-button" on:click={() => {paste("Content")}}>
                {#if pasted == "Content"}
                  <CircleCheck size="14"/>
                {:else}
                  <Clipboard size="14"/>
                {/if}
                Paste from Clipboard
              </button>
            </div>
            <div class="character-count">
              {#if writing_content?.length > max_char_length*0.5}
                <span class={writing_content?.length > max_char_length ? "error" : ""}>({writing_content?.length ? writing_content.length.toLocaleString() : "0"}/{max_char_length.toLocaleString()} Characters)</span>

                {#if writing_content?.length > max_char_length*0.8 && $currentUser?.plan == "free"}
                  <a href="/pro">Upgrade to Pro for more</a>
                {/if}
              {/if}
            </div>
          </div>
        </div>
        <div class="page-section">
          <h2>
            <span>Add
              {#if writing_type == "College Application"}
                the essay prompt
              {:else if writing_type == "Academic Essay"}
                the instructions or rubric
              {:else if writing_type == "Email"}
                context
              {:else}
                writing instructions or context
              {/if}
            </span>
          </h2>
          <p class="description">
            {#if writing_type == "College Application"}
              Add the prompt for the essay here. Optionally, include the word count limit.
            {:else if writing_type == "Academic Essay"}
              If you recieved a prompt, rubric, or instructions from your teacher, add them here.
            {:else if writing_type == "Email"}
              What's the context for your email?
            {:else}
              Add any additional context or instructions to help Classmate understand what goal your writing aims to achieve.
            {/if}
          </p>
          <div class="text-input-wrapper">
            <textarea bind:value={writing_context} name="content" placeholder="Type here..."></textarea>
            <div class="input-other-options">
              <span>or</span>
              <button class="simple-button" on:click={() => {paste("Context")}}>
                {#if pasted == "Context"}
                  <CircleCheck size="14"/>
                {:else}
                  <Clipboard size="14"/>
                {/if}
                Paste from Clipboard
              </button>
              <span>or</span>
              <button class="simple-button" disabled>
                <ImageUp size="14"/>
                Upload Image
                <span class="alert">Coming Soon</span>
              </button>
            </div>
            <div class="character-count">
              {#if writing_context?.length > max_char_length*0.5}
                <span class={writing_context?.length > max_char_length ? "error" : ""}>({writing_context?.length ? writing_context.length.toLocaleString() : "0"}/{max_char_length.toLocaleString()} Characters)</span>

                {#if writing_context?.length > max_char_length*0.8 && $currentUser?.plan == "free"}
                  <a href="/pro">Upgrade to Pro for more</a>
                {/if}
              {/if}
            </div>
          </div>
        </div>
        <button class="button next-step" disabled={!writing_content || writing_content?.length > max_char_length || writing_context?.length > max_char_length} on:click={stepTwo}>
          Next ->
        </button>
      </div>
    </div>
    <div class="form-page">
      <div class="page-wrapper">
        <h2>
          <span>What type of feedback are you looking for?</span>
          <HoverTooltip class="info-tooltip extra-padding" text="Select a feedback focus — this will help Classmate personalize your feedback to be the best it can." offset={-4} max_width="16rem">
            <Info size="16" />
          </HoverTooltip>
        </h2>
        <div class="selector">
          <button class={writing_feedback_focus == "Balanced" ? "selector-item selected" : "selector-item"} on:click={() => {stepThree("Balanced")}}>
            <div class="top-group">
              <h3>
                <Star size="16"/>
                <span>Balanced</span>
              </h3>
              <span class="alert">
                Recomended
              </span>
            </div>
            <p>A balanced combination of all types of feedback</p>
          </button>
          <button class={writing_feedback_focus == "Grammar & Spelling" ? "selector-item selected" : "selector-item"} on:click={() => {stepThree("Grammar & Spelling")}}>
            <h3>
              <PencilRuler size="16"/>
              <span>Grammar & Spelling</span>
            </h3>
            <p>Human-like grammar and spelling checks</p>
          </button>
          <button class={writing_feedback_focus == "Word Reduction" ? "selector-item selected" : "selector-item"} on:click={() => {stepThree("Word Reduction")}}>
            <h3>
              <FileMinus2 size="16"/>
              <span>Word Reduction</span>
            </h3>
            <p>Looking to get that essay under the word limit?</p>
          </button>
          <button class="selector-item" disabled>
            <h3>
              <Brain size="16"/>
              <span>Advanced</span>
            </h3>
            <span class="alert">Coming Soon</span>
          </button>
        </div>
        <button class="button submit" on:click={getFeedback} disabled={!writing_content || !writing_type || !writing_feedback_focus || writing_content?.length > max_char_length || writing_context?.length > max_char_length}>Get Feedback -></button>
      </div>
    </div>
  </div>
</main>