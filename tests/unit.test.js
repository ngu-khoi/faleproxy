const cheerio = require("cheerio")
const { sampleHtmlWithYale } = require("./test-utils")

// Helper function to replicate the same logic as in app.js
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

describe("Yale to Fale replacement logic", () => {
	test("should replace Yale with Fale in text content", () => {
		const $ = cheerio.load(sampleHtmlWithYale)

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

		const modifiedHtml = $.html()

		// Check text replacements
		expect(modifiedHtml).toContain("Fale University Test Page")
		expect(modifiedHtml).toContain("Welcome to Fale University")
		expect(modifiedHtml).toContain(
			"Fale University is a private Ivy League"
		)
		expect(modifiedHtml).toContain("Fale was founded in 1701")

		// Check that URLs remain unchanged
		expect(modifiedHtml).toContain("https://www.yale.edu/about")
		expect(modifiedHtml).toContain("https://www.yale.edu/admissions")
		expect(modifiedHtml).toContain("https://www.yale.edu/images/logo.png")
		expect(modifiedHtml).toContain("mailto:info@yale.edu")

		// Check href attributes remain unchanged
		expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/about"/)
		expect(modifiedHtml).toMatch(
			/href="https:\/\/www\.yale\.edu\/admissions"/
		)

		// Check that link text is replaced
		expect(modifiedHtml).toContain(">About Fale<")
		expect(modifiedHtml).toContain(">Fale Admissions<")

		// Check that alt attributes are not changed
		expect(modifiedHtml).toContain('alt="Yale Logo"')
	})

	test("should handle text that has no Yale references", () => {
		const htmlWithoutYale = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Hello World</h1>
        <p>This is a test page with no university references at all.</p>
      </body>
      </html>
    `

		const $ = cheerio.load(htmlWithoutYale)

		// Apply the same replacement logic
		$("body *")
			.contents()
			.filter(function () {
				return this.nodeType === 3
			})
			.each(function () {
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		const modifiedHtml = $.html()

		// Content should remain the same since there are no Yale references
		expect(modifiedHtml).toContain("<title>Test Page</title>")
		expect(modifiedHtml).toContain("<h1>Hello World</h1>")
		expect(modifiedHtml).toContain(
			"<p>This is a test page with no university references at all.</p>"
		)
	})

	test("should handle case-insensitive replacements", () => {
		const mixedCaseHtml = `
      <p>YALE University, Yale College, and yale medical school are all part of the same institution.</p>
    `

		const $ = cheerio.load(mixedCaseHtml)

		$("body *")
			.contents()
			.filter(function () {
				return this.nodeType === 3
			})
			.each(function () {
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		const modifiedHtml = $.html()

		expect(modifiedHtml).toContain(
			"FALE University, Fale College, and fale medical school"
		)
	})

	test("should handle mixed case variations", () => {
		const weirdCaseHtml = `
      <p>YaLe and yAlE and YAle and yaLE are all variations.</p>
    `

		const $ = cheerio.load(weirdCaseHtml)

		$("body *")
			.contents()
			.filter(function () {
				return this.nodeType === 3
			})
			.each(function () {
				const text = $(this).text()
				const newText = replaceYaleWithFale(text)
				if (text !== newText) {
					$(this).replaceWith(newText)
				}
			})

		const modifiedHtml = $.html()

		expect(modifiedHtml).toContain(
			"FaLe and fAlE and FAle and faLE are all variations"
		)
	})
})
