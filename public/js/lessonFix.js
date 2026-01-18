/* =========================================
   Auto-wrap + Click-to-Zoom for Lesson Videos
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Auto-wrap videos for responsiveness
  const selectors = ".lesson-content iframe, .lesson-content video, .lesson-content embed, .lesson-content object";
  const videos = document.querySelectorAll(selectors);

  videos.forEach(video => {
    if (video.parentElement.classList.contains("video-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper";

    // Transparent click layer that triggers zoom
    const clickLayer = document.createElement("div");
    clickLayer.className = "video-click-layer";

    video.parentNode.insertBefore(wrapper, video);
    wrapper.appendChild(video);
    wrapper.appendChild(clickLayer);

    // Disable clicks on inline iframe so layer gets them
    video.style.pointerEvents = "none";
  });

  // 2️⃣ Create zoom overlay
  const vidOverlay = document.createElement("div");
  vidOverlay.className = "video-zoom-overlay";
  document.body.appendChild(vidOverlay);

  // 3️⃣ Attach click behavior
  document.querySelectorAll(".lesson-content .video-wrapper .video-click-layer").forEach(layer => {
    layer.addEventListener("click", () => {
      const wrapper = layer.parentElement;
      const iframe = wrapper.querySelector("iframe");
      const video = wrapper.querySelector("video");
      let clone;

      if (iframe) {
        clone = iframe.cloneNode(true);
      } else if (video) {
        clone = video.cloneNode(true);
        clone.controls = true;
      }

      if (clone) {
        // Re-enable pointer events for the popup video
        clone.style.pointerEvents = "auto";

        vidOverlay.innerHTML = "";
        vidOverlay.appendChild(clone);
        vidOverlay.classList.add("active");
      }
    });
  });

  // 4️⃣ Close overlay
  vidOverlay.addEventListener("click", e => {
    // only close if user clicked outside the video
    if (e.target === vidOverlay) {
      vidOverlay.classList.remove("active");
      vidOverlay.innerHTML = "";
    }
  });
});
