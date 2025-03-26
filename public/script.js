document.addEventListener("DOMContentLoaded", () => {
	const urlForm = document.getElementById("url-form")
	const urlInput = document.getElementById("url-input")
	const loadingElement = document.getElementById("loading")
	const errorMessage = document.getElementById("error-message")
	const resultContainer = document.getElementById("result-container")
	const contentDisplay = document.getElementById("content-display")
	const originalUrlElement = document.getElementById("original-url")
	const pageTitleElement = document.getElementById("page-title")

	let currentBaseUrl = "" // Store the base URL for relative links

	urlForm.addEventListener("submit", async (e) => {
		e.preventDefault()
		currentBaseUrl = urlInput.value.trim() // Store the initial URL
		await fetchAndReplace(currentBaseUrl)
	})

	async function fetchAndReplace(url) {
		if (!url) {
			showError("Please enter a valid URL")
			return
		}

		// Show loading indicator
		loadingElement.classList.remove("hidden")
		errorMessage.classList.add("hidden")

		try {
			const response = await fetch("/fetch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ url }),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Failed to fetch content")
			}

			// Update the info bar with the current page URL
			originalUrlElement.textContent = url
			originalUrlElement.href = url
			pageTitleElement.textContent = data.title || "No title"

			// Create a sandboxed iframe to display the content
			const iframe = document.createElement("iframe")
			iframe.sandbox = "allow-same-origin allow-scripts"
			contentDisplay.innerHTML = ""
			contentDisplay.appendChild(iframe)

			// Write the modified HTML to the iframe
			const iframeDocument =
				iframe.contentDocument || iframe.contentWindow.document
			iframeDocument.open()
			iframeDocument.write(data.content)
			iframeDocument.close()

			// Adjust iframe height to match content
			iframe.onload = function () {
				iframe.style.height = iframeDocument.body.scrollHeight + "px"

				// Intercept link clicks
				const links = iframeDocument.querySelectorAll("a")
				links.forEach((link) => {
					link.addEventListener("click", (e) => {
						e.preventDefault()
						const href = link.getAttribute("href")
						if (href) {
							// Handle relative URLs using the current page URL as base
							const absoluteUrl = new URL(href, url).href
							fetchAndReplace(absoluteUrl)
						}
					})
				})
			}

			// Show result container
			resultContainer.classList.remove("hidden")
		} catch (error) {
			showError(error.message)
		} finally {
			// Hide loading indicator
			loadingElement.classList.add("hidden")
		}
	}

	function showError(message) {
		errorMessage.textContent = message
		errorMessage.classList.remove("hidden")
	}
})
