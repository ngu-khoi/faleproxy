const express = require("express")
const axios = require("axios")
const cheerio = require("cheerio")
const path = require("path")

const app = express()
const PORT = 3001

// Middleware to parse request bodies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

// Route to serve the main page
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Function to replace Yale with Fale while properly preserving case
function replaceYaleWithFale(text) {
	if (!text || typeof text !== "string") return text

	// Case-preserving replacement that works for any case variations
	return text.replace(/[Yy][Aa][Ll][Ee]/g, (match) => {
		// Map each character from Yale to corresponding character in Fale
		return match
			.split("")
			.map((char, index) => {
				// For the first position, 'Y' becomes 'F', 'y' becomes 'f'
				if (index === 0) {
					return char === "Y" ? "F" : "f"
				}
				// For the second position, 'A' becomes 'A', 'a' becomes 'a' (unchanged)
				else if (index === 1) {
					return char
				}
				// For the third position, 'L' becomes 'L', 'l' becomes 'l' (unchanged)
				else if (index === 2) {
					return char
				}
				// For the fourth position, 'E' becomes 'E', 'e' becomes 'e' (unchanged)
				else {
					return char
				}
			})
			.join("")
	})
}

// API endpoint to fetch and modify content
app.post("/fetch", async (req, res) => {
	try {
		const { url } = req.body

		if (!url) {
			return res.status(400).json({ error: "URL is required" })
		}

		// Fetch the content from the provided URL
		const response = await axios.get(url)
		const html = response.data

		// Use cheerio to parse HTML and selectively replace text content, not URLs
		const $ = cheerio.load(html)

		// Process text nodes in the body
		$("body *")
			.contents()
			.filter(function () {
				return this.nodeType === 3 // Text nodes only
			})
			.each(function () {
				// Replace text content but not in URLs or attributes
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		// Process title separately
		const title = $("title").text()
		const newTitle = replaceYaleWithFale(title)
		$("title").text(newTitle)

		return res.json({
			success: true,
			content: $.html(),
			title: newTitle,
			originalUrl: url,
		})
	} catch (error) {
		console.error("Error fetching URL:", error.message)
		return res.status(500).json({
			error: `Failed to fetch content: ${error.message}`,
		})
	}
})

// Start the server
app.listen(PORT, () => {
	console.log(`Faleproxy server running at http://localhost:${PORT}`)
})
