const frame = document.getElementById("contentFrame");

document.querySelectorAll(".sidebar a").forEach(link => {
  link.addEventListener("click", () => {

    const page = link.dataset.page;

    // 🔒 SAFETY GUARD
    if (!page) {
      console.error("Sidebar link missing data-page:", link);
      return;
    }

    document.querySelectorAll(".sidebar a")
      .forEach(a => a.classList.remove("active"));

    link.classList.add("active");

    frame.src = page;
  });
});
