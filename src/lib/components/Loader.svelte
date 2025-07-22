<script>
  export let visible = false;
  export let error = false;
  let loading_percentage = 0;

  const quotes = [
    {
      quote: "Everything in life is writable about if you have the outgoing guts to do it, and the imagination to improvise. The worst enemy to creativity is self-doubt.",
      author: "Sylvia Plath"
    },
    {
      quote: "One day I will find the right words, and they will be simple.",
      author: "Jack Kerouac"
    },
    {
      quote: "If you wait for inspiration to write you're not a writer, you're a waiter.",
      author: "Dan Poynter"
    },
    {
      quote: "All good writing is swimming under water and holding your breath.",
      author: "F. Scott Fitzgerald"
    },
    {
      quote: "I admire anybody who has the guts to write anything at all.",
      author: "E. B. White"
    },
    {
      quote: "You only learn to be a better writer by actually writing.",
      author: "Doris Lessing"
    },
    {
      quote: "Words - so innocent and powerless as they are, as standing in a dictionary, how potent for good and evil they become in the hands of one who knows how to combine them. ",
      author: "Nathaniel Hawthorne"
    },
    {
      quote: "There is no greater agony than bearing an untold story inside you.",
      author: "Maya Angelou"
    },
    {
      quote: "The scariest moment is always just before you start.",
      author: "Stephen King"
    },
    {
      quote: "How vain it is to sit down to write when you have not stood up to live.",
      author: "Henry David Thoreau"
    },
    {
      quote: "The single biggest problem in communication is the illusion that it has taken place.",
      author: "George Bernard Shaw"
    },
    {
      quote: "It takes humility to seek feedback. It takes wisdom to understand it, analyze it and appropriately act on it.",
      author: "Stephen Covey"
    },
    {
      quote: "The key to learning is feedback. It is nearly impossible to learn anything without it.",
      author: "Steven Levitt"
    },
    {
      quote: "There is no end to education. It is not that you read a book, pass an examination, and finish with education. The whole of life, from the moment you are born to the moment you die, is a process of learning.",
      author: "Jiddu Krishnamurti"
    },
    {
      quote: "Anyone who stops learning is old, whether at twenty or eighty. Anyone who keeps learning stays young. The greatest thing in life is to keep your mind young.",
      author: "Henry Ford"
    },
    {
      quote: "Recipes tell you nothing. Learning techniques is the key.",
      author: "Tom Colicchio"
    },
    {
      quote: "He who learns but does not think, is lost! He who thinks but does not learn is in great danger.",
      author: "Confucius"
    },
    {
      quote: "An investment in knowledge pays the best interest.",
      author: "Benjamin Franklin"
    },
    {
      quote: "Often when you think you're at the end of something, you're at the beginning of something else.",
      author: "Fred Rogers"
    },
    {
      quote: "Success seems to be connected with action. Successful people keep moving. They make mistakes but they don't quit.",
      author: "Conrad Hilton"
    },
  ]

  const random_quote = quotes[Math.floor(Math.random() * quotes.length)]

  let loading_quote_text = random_quote.quote,
      loading_quote_author = random_quote.author,
      loading_note_rotation = 2 + 2 * Math.random();

  if (Math.random() >= 0.5) {
    loading_note_rotation *= -1;
  }

  export function startLoading() {
    const times = [
      2000 + Math.floor(Math.random()*5)*500,
      6000 + Math.floor(Math.random()*5)*500,
      12000 + Math.floor(Math.random()*5)*500,
      18000 + Math.floor(Math.random()*5)*500,
      24000 + Math.floor(Math.random()*5)*500,
      30000 + Math.floor(Math.random()*5)*500
    ]
    const steps = [
      10 + Math.floor(Math.random()*3)*5,
      30 + Math.floor(Math.random()*3)*5,
      50 + Math.floor(Math.random()*3)*5,
      65 + Math.floor(Math.random()*3)*5,
      75 + Math.floor(Math.random()*3)*5,
      85 + Math.floor(Math.random()*3)*5
    ]

    times.forEach((time, i) => {
      setTimeout(() => {
        if (!error && loading_percentage !== 100) {
          loading_percentage = steps[i]
        }
      }, time)
    })
  }

  export function finishLoading() {
    loading_percentage = 100;
  }
</script>

<div class={visible ? "loading-screen" : "loading-screen hidden"}>
  <div class="loading-marquee">
    {#if error}
      <div>
        {#each new Array(10).fill("Error") as marquee_text}
          <span>{marquee_text}</span>
        {/each}
      </div>
      <div>
        {#each new Array(10).fill("Error") as marquee_text}
          <span>{marquee_text}</span>
        {/each}
      </div>
    {:else}
      <div>
        {#each new Array(10).fill("Loading") as marquee_text}
          <span>{marquee_text}</span>
        {/each}
      </div>
      <div>
        {#each new Array(10).fill("Loading") as marquee_text}
          <span>{marquee_text}</span>
        {/each}
      </div>
    {/if}
  </div>
  <div class={error ? "loading-note error" : "loading-note"} style={`--rotation: ${loading_note_rotation}deg`}>
    {#if error}
      <p>Uh oh - we've encountered an error! <a href="?retry=true" data-sveltekit-reload>Go back?</a></p>
      <p>{error}</p>
    {:else}
      <p>{loading_quote_text}</p>
      <p>— {loading_quote_author}</p>
    {/if}
  </div>
  <div class="loading-percentage" style={`--percentage: ${loading_percentage / 100};`}>
    <span>{loading_percentage}<small>%</small></span>
  </div>
  <div class="loading-line"></div>
</div>