import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const brainDir = 'C:\\Users\\nckic\\.gemini\\antigravity\\brain';

async function searchInFile(filePath, dirName) {
    if (!fs.existsSync(filePath)) return;
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineNum = 0;
    for await (const line of rl) {
        lineNum++;
        if (line.includes('등머신')) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'USER_INPUT' || parsed.source === 'USER_EXPLICIT') {
                    console.log(`\n=== Found in ${dirName} (line ${lineNum}) ===`);
                    console.log(parsed.content);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }
}

async function main() {
    const dirs = fs.readdirSync(brainDir);
    for (const dir of dirs) {
        const dirPath = path.join(brainDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
            const transcriptFull = path.join(dirPath, '.system_generated', 'logs', 'transcript_full.jsonl');
            await searchInFile(transcriptFull, dir);
            const transcriptShort = path.join(dirPath, '.system_generated', 'logs', 'transcript.jsonl');
            await searchInFile(transcriptShort, dir);
        }
    }
    console.log("\nSearch complete!");
}

main();
