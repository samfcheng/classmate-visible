<script>
  import '$lib/styles/docs.scss';

  import { currentUser, pb } from '$lib/pocketbase'
  import Navbar from '$lib/components/Navbar.svelte';
  import AuthBlock from '$lib/components/AuthBlock.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import Popup from '$lib/components/Popup.svelte';

  import { demo_doc } from '$lib/demo_doc.js';

  import { onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  import DOMPurify from 'isomorphic-dompurify';

  import { Trash, BookText, GraduationCap, PencilRuler, Mail, File } from 'lucide-svelte';

  let grid_element;

  let intro_tooltip_visible = false;
  let no_reviews = false;

  let reviews = [];
  let items;

  let edu_upgrade_popup = false;

  onMount(async () => {
    items = grid_element.children.length;
    grid_element.style.maxWidth = `${items * 20}rem`;

    if ($currentUser) {
      reviews = await pb.collection('feedback').getFullList({filter: `user="${$currentUser.id}"`, sort: "-created"});
      if (reviews.length == 0) {
        no_reviews = true;
      }

      items = reviews.length + 1;
      if (items < 6) {
        grid_element.style.maxWidth = `${items * 20}rem`;
      }
      
      const userInfo = await pb.collection('users').getOne($currentUser.id, {expand: 'institution'})
      currentUser.set(userInfo)

      if (reviews.length == 0 && !$currentUser.data?.created_demo_doc) {
        console.log("No reviews found. Creating one...");
        
        const created_demo_doc = await pb.collection('feedback').create({
          user: $currentUser.id,
          ...demo_doc
        })

        let stored_data = $currentUser.data || {};
        stored_data.created_demo_doc = true;
        await pb.collection('users').update($currentUser.id, { data: stored_data });

        reviews = [created_demo_doc];
      }

      if (!$currentUser.data?.seenDocsIntro) {
        intro_tooltip_visible = true;

        let stored_data = $currentUser.data || {};
        stored_data.seenDocsIntro = true;
        await pb.collection('users').update($currentUser.id, { data: stored_data });
      }

      items = reviews.length + 1;
      if (items < 6) {
        grid_element.style.maxWidth = `${items * 20}rem`;
      } 
    }

    // Check if the user was upgraded to institutional pro
    const edu_pro_upgrade = $page.url.searchParams.get('edu_pro_upgrade');
    if (edu_pro_upgrade) {
      edu_upgrade_popup = true;
      goto(`./feedback`)
    }
  });

  async function deleteReview(review_id) {
    if (window.confirm("Are you sure you want to delete this writing review?")) {
      try {
        pb.collection('feedback').delete(review_id);
        reviews = reviews.filter(item => item.id !== review_id);

        if (reviews.length == 0) {
          no_reviews = true;
        }

        items = reviews.length + 1;
        if (items < 6) {
          grid_element.style.maxWidth = `${items * 20}rem`;
        }
      } catch (err) {
        alert(err)
      }
    }
  }
</script>

<Metatags title="Your Documents"/>

<AuthBlock />

<Navbar />

<Popup visible={edu_upgrade_popup}>
  <h2 class="popup-title">🎉 Welcome to Classmate Pro</h2>
  <p>Since you're a student at {#if $currentUser?.expand?.institution?.name}{$currentUser?.expand?.institution?.name}{:else}a school that has Classmate Pro access{/if}, you've been granted institutional access to Classmate Pro, allowing for increased submission length, early access to new features, and more.</p>
  <button class="button" on:click={() => {edu_upgrade_popup = false}}>Close</button>
</Popup>

<header class="docs-header">
  <h1>Your Documents</h1>
</header>

<main class="docs-main">
  <div class="docs-list" bind:this={grid_element}>
    <a href="/new" class="create-new">
      <Tooltip wrapper={false} text="Click here to get feedback" visible={intro_tooltip_visible}/>
      <span class="text">Create New</span>
    </a>
    {#if reviews?.length}
      {#each reviews as review, i}
        {#if !review.hidden && $currentUser?.id}
          <div class="doc-wrapper">
            {#if i == 0}
              <Tooltip wrapper={false} text="Or, click here to view a previous doc" visible={intro_tooltip_visible}/>
            {/if}
            <button class="floating-trash-button" on:click={() => {deleteReview(review.id)}}><Trash size="16"/></button>
            <a class="doc" href={`/edit/${review.id}`}>
              <div class="doc-preview-text">
                {#if review.preview_text}
                  <p>{@html DOMPurify.sanitize(review.preview_text)}</p>
                {:else if review.saved_html}
                  {@html DOMPurify.sanitize(review.saved_html.slice(0, 500))}
                {:else if review.content}
                  <p>{review.content.slice(0, 500)}</p>
                {:else}
                  <p>No preview text available</p>
                {/if}
              </div>
              <div class="doc-info">
                <h2>{review.title}</h2>
                <span class="type">
                  {#if review.type == "Academic Essay"}
                    <BookText size="14"/>
                  {:else if review.type == "College Application"}
                    <GraduationCap size="14"/>
                  {:else if review.type == "Creative Writing"}
                    <PencilRuler size="14"/>
                  {:else if review.type == "Email"}
                    <Mail size="14"/>
                  {:else}
                    <File size="14"/>
                  {/if}
                  {#if review.type}
                    {review.type}
                  {:else}
                    Unknown
                  {/if}
                </span>
              </div>
            </a>
          </div>
        {/if}
      {/each}
    {:else if !no_reviews}
      <div class="loading-placeholder-doc">
        <div class="placeholder-info">
          <h2>Loading...</h2>
          <span>Loading...</span>
        </div>
      </div>
      <div class="loading-placeholder-doc">
        <div class="placeholder-info">
          <h2>Loading...</h2>
          <span>Loading...</span>
        </div>
      </div>
      <div class="loading-placeholder-doc">
        <div class="placeholder-info">
          <h2>Loading...</h2>
          <span>Loading...</span>
        </div>
      </div>
      <div class="loading-placeholder-doc">
        <div class="placeholder-info">
          <h2>Loading...</h2>
          <span>Loading...</span>
        </div>
      </div>
      <div class="loading-placeholder-doc">
        <div class="placeholder-info">
          <h2>Loading...</h2>
          <span>Loading...</span>
        </div>
      </div>
      <div class="loading-placeholder-doc">
        <div class="placeholder-info">
          <h2>Loading...</h2>
          <span>Loading...</span>
        </div>
      </div>
    {/if}
  </div>
</main>