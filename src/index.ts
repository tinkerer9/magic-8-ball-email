import PostalMime from "postal-mime";
import { createMimeMessage } from "mimetext";
import { EmailMessage } from "cloudflare:email";

const responses = [
    "It is certain.",
    "It is decidedly so.",
    "You may rely on it.",
    "Outlook good.",
    "Signs point to yes.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

async function getAnswer(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", data);

    const number = new DataView(hash).getUint32(0);

    return responses[number % responses.length];
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
        
        // Combine everything that should affect the answer.
        const input = [
            normalize(message.from),
            normalize(email.subject ?? ""),
            normalize(email.text ?? "")
        ].join("\n");
        
        const answer = await getAnswer(input);
        
        const reply = createMimeMessage();
        
        const messageId = message.headers.get("Message-ID");
        
        if (messageId) {
            reply.setHeader("In-Reply-To", messageId);
            reply.setHeader("References", messageId);
        }
        
        reply.setSender(`Magic 8 Ball <${message.to}>`);
        reply.setRecipient(message.from);
        reply.setSubject(`Re: ${email.subject || "(no subject)"}`);
        
        reply.addMessage({
            contentType: "text/plain",
            data: `🎱 Magic 8 Ball says:\n\n${answer}`
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

        await message.forward("max@maxparisi.me");
    }
} satisfies ExportedHandler;