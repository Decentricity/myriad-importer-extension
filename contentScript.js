
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message === "get_selected_text") {
            var selectedText = window.getSelection().toString();

            // Truncate it to the first 1000 characters
            selectedText = selectedText.substr(0, 1000);

            // Break it into lines
            var textBlocks = selectedText.split('\n').filter(function (txt) {
                // Remove empty lines
                return txt.trim().length > 0;
            });

            // Convert each line into a link
            textBlocks = textBlocks.map(function (txt) {
                return `<p><i>${txt}</i></p>`;
            });

            sendResponse({data: textBlocks});
        }
    }
);
