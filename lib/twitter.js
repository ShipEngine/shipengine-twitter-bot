const Twitter = require("twit");
const buildResponse = require("./buildResponse");

const account_id = process.env.TWITTER_ACCOUNT_ID;
const consumer_key = process.env.TWITTER_CONSUMER_KEY;
const consumer_secret = process.env.TWITTER_CONSUMER_SECRET;
const access_token = process.env.TWITTER_ACCESS_TOKEN;
const access_token_secret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

// Connect to the Twitter Streaming API
let twitter = new Twitter({ consumer_key, consumer_secret, access_token, access_token_secret });
let stream = twitter.stream("user");

// Listen for incoming tweets
stream.on("tweet", handleTweet);
console.log("Waiting for somebody to tweet to us...");

/**
 * Responds to tweets such as "How much to send a 3lb package from New York to London?"
 * with responses like "It'll cost between $5.75 and $9.00 to send your 3lb package from New York to London".
 *
 * @param {object} tweet - A Twitter API tweet object (https://developer.twitter.com)
 */
async function handleTweet (tweet) {
  // Ignore our own tweets
  if (tweet.user.id_str === account_id) {
    return;
  }

  try {
    // Get the text of the tweet
    let tweetText = tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text;
    console.log(`Received at tweet from @${tweet.user.screen_name}:`, tweetText);

    // Build a response to the user
    let response = `@${tweet.user.screen_name} ` + await buildResponse(tweetText);
    console.log("Sending response:", response);

    // Tweet the response as a reply to the original tweet
    twitter.post("statuses/update", {
      status: response,
      in_reply_to_status_id: tweet.id_str,
    });
  }
  catch (error) {
    console.error(error);
  }
}
