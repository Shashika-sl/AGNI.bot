const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const { cmd } = require("../command");

cmd({
    pattern: "song",
    desc: "Download song directly",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🎵 *Please type a song name!* \n\n💡 Example: _.song despacito_");

        reply("🔎 *Searching your song... Please wait!*");

        let search = await yts(q);
        let video = search.videos[0];
        if (!video) return reply("❌ Sorry, I couldn't find that song!");

        // ✅ make sure temp folder exists
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log("✅ Temp folder created:", tempDir);
        }

        let filePath = path.join(tempDir, `${Date.now()}.mp3`);

        // ✅ Download audio
        const stream = ytdl(video.url, { filter: "audioonly", quality: "highestaudio" })
            .pipe(fs.createWriteStream(filePath));

        stream.on("close", async () => {
            try {
                // send audio file
                await conn.sendMessage(from, {
                    audio: fs.readFileSync(filePath),
                    mimetype: "audio/mpeg",
                    fileName: `${video.title}.mp3`,
                }, { quoted: mek });

                // send info text
                await conn.sendMessage(from, {
                    text: `🎶 *${video.title}*\n📺 Channel: ${video.author.name}\n⏱️ Duration: ${video.timestamp}\n👀 Views: ${video.views.toLocaleString()}`
                }, { quoted: mek });

            } finally {
                // cleanup temp file
                fs.unlinkSync(filePath);
            }
        });

    } catch (e) {
        console.log(e);
        reply("⚠️ Error: " + e.message);
    }
});
