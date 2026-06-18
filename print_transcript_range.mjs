import * as fs from 'fs';
import * as readline from 'readline';

async function main() {
    const fileStream = fs.createReadStream('C:\\Users\\nckic\\.gemini\\antigravity\\brain\\acf1d343-d677-45cd-b865-4be67bb37697\\.system_generated\\logs\\transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let index = 0;
    for await (const line of rl) {
        index++;
        if (index >= 280 && index <= 315) {
            try {
                const parsed = JSON.parse(line);
                console.log(`\n=== Entry ${index} (${parsed.type}) ===`);
                console.log(parsed.content || JSON.stringify(parsed));
            } catch (e) {
                console.log(`Entry ${index} (failed to parse):`, line);
            }
        }
    }
}
main();
