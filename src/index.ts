import PostalMime from "postal-mime";
import { createMimeMessage } from "mimetext";
import { EmailMessage } from "cloudflare:email";

const responses = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes, definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

async function getAnswer(input: string): Promise<string> {
    // SHA-256 gives us deterministic, well-distributed bytes.
    const data = new TextEncoder().encode(input);
    
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hash);
    
    // Use the first 4 bytes as an unsigned 32-bit number.
    const number =
        bytes[0] * 2 ** 24 +
        bytes[1] * 2 ** 16 +
        bytes[2] * 2 ** 8 +
        bytes[3];
    
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
        
        reply.setSender(message.to);
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
                reply.asRaw(),
            )
        );
    }
} satisfies ExportedHandler;