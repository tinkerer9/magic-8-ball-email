import PostalMime from "postal-mime";
import { createMimeMessage } from "mimetext";
import { EmailMessage } from "cloudflare:email";

const responses = [ // 8 responses = 3 bits
    "It is certain.", // 000
    "It is decidedly so.", // 001
    "You may rely on it.", // 010
    "Signs point to yes.", // 011
    "Don't count on it.", // 100
    "My reply is no.", // 101
    "My sources say no.", // 110
    "Very doubtful." // 111
];

async function getAnswer(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", data);

    const number = new DataView(hash).getUint8(0) >> 5; // extract first 3 bits

    return responses[number];
}

function normalize(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

export default {
    async email(message): Promise<void> {
        const email = await PostalMime.parse(message.raw);

        const input = [
            normalize(message.from),
            normalize(email.subject ?? ""),
            normalize(email.text ?? "")
        ].join("\n");

        const answer = await getAnswer(input);

        console.log(`${answer}: "${email.subject}": (${message.from})\n"${(email.text ?? "").replace(/\s+/g, " ").trim()}"`);

        const reply = createMimeMessage();

        const messageId = message.headers.get("Message-ID");
        const references = message.headers.get("References");

        if (messageId) {
            reply.setHeader("In-Reply-To", messageId);

            const referenceChain = [ references, messageId ]
                .filter(Boolean)
                .join(" ");

            reply.setHeader("References", referenceChain);
        }

        reply.setSender({ name: "Magic 8 Ball", addr: message.to});
        reply.setRecipient(message.from);
        reply.setSubject(`Re: ${email.subject || "(no subject)"}`);

        reply.addMessage({
            contentType: "text/plain",
            data: `Magic 8 Ball says: ${answer}`
        });

        reply.addMessage({
            contentType: "text/html",
            data: `\
<div style="font-family: sans-serif; text-align: center;">
<div style="font-size: 64px;">🎱</div>
<p><strong>Magic 8 Ball says:</strong></p>
<p style="font-size: 24px;">${answer}</p>
</div>`
        });

        await message.reply(
            new EmailMessage(
                message.to,
                message.from,
                reply.asRaw()
            )
        );
    }
} satisfies ExportedHandler;