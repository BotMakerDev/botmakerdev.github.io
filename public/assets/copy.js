// Adds a copy button to every snippet on the page.
//
// The button is written here rather than into the HTML on purpose: without JavaScript there is no
// button at all, instead of a dead one, and the snippet stays exactly as selectable as it was.
// Shared by the organization page and the project pages, which is why it looks for <pre> rather
// than for anything only one of them emits.
(function () {
  "use strict";

  if (!navigator.clipboard) return;

  document.querySelectorAll("pre").forEach(function (pre) {
    // The org page wraps each <pre> in .snippet; a project page does not, so wrap it here. Either
    // way the button positions against a container that is exactly the snippet's size.
    var host = pre.parentElement;
    if (!host.classList.contains("snippet")) {
      host = document.createElement("div");
      host.className = "snippet";
      pre.parentNode.insertBefore(host, pre);
      host.appendChild(pre);
    }

    var button = document.createElement("button");
    button.className = "copy";
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy this command");

    button.addEventListener("click", function () {
      navigator.clipboard.writeText(pre.innerText.trim()).then(function () {
        button.textContent = "Copied";
        button.dataset.done = "yes";
        setTimeout(function () {
          button.textContent = "Copy";
          delete button.dataset.done;
        }, 1600);
      }, function () {
        // A clipboard write can be refused by permission policy. Say so rather than claim success.
        button.textContent = "Press Ctrl+C";
        setTimeout(function () { button.textContent = "Copy"; }, 2400);
      });
    });

    host.appendChild(button);
  });
})();
