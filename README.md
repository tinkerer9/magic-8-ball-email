# Email-Based Magic 8-Ball

I was experimenting with [Cloudflare's Email Workers](https://developers.cloudflare.com/email-service/api/route-emails/email-handler/), and made a **magic 8-ball** that works via email.

When someone sends an email, Cloudflare's edge servers run the worker in [`src/index.ts`](src/index.ts).
The script hashes the email&mdash;sender, subject, and body&mdash;as a SHA-256 string, extracts the first 32-bits, and uses that for the response index.
Unlike randomly picking a response, this method gives the exact same result if the question is the same.

<!-- markdownlint-disable-next-line MD026 -->
## Try it out!

Send an email to [**8ball@maxparisi.me**](mailto:8ball@maxparisi.me).
The worker may take up to 30 seconds, so be patient!

## Responses

I didn't want to have any vague answers, such as *"Try again,"* especially with the SHA-256 hashing, so the answers are only yes or no.

- *"It is certain."*
- *"It is decidedly so."*
- *"You may rely on it."*
- *"Outlook good."*
- *"Signs point to yes."*
- *"Don't count on it."*
- *"My reply is no."*
- *"My sources say no."*
- *"Outlook not so good."*
- *"Very doubtful."*
