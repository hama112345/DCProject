
(() => {
  "use strict";

  const navLinks = [...document.querySelectorAll(".side-nav [data-nav]")];
  const sections = [...document.querySelectorAll("[data-section]")];

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.dataset.section;
      navLinks.forEach(link => link.classList.toggle("is-active", link.dataset.nav === id));
    }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, .1, .25, .5] });
    sections.forEach(section => observer.observe(section));
  } else if (navLinks[0]) {
    navLinks[0].classList.add("is-active");
  }

  const buttons = [...document.querySelectorAll(".filter-btn")];
  const tasks = [...document.querySelectorAll(".task-card")];

  function applyFilter(key) {
    tasks.forEach(task => {
      const status = task.dataset.status;
      const priority = task.dataset.priority === "priority";
      let show = true;
      if (key === "open") show = status !== "done";
      if (key === "priority") show = priority;
      if (key === "doing") show = status === "doing";
      if (key === "todo") show = status === "todo";
      if (key === "all") show = true;
      task.hidden = !show;
    });
    buttons.forEach(btn => btn.classList.toggle("is-active", btn.dataset.filter === key));
  }

  buttons.forEach(btn => btn.addEventListener("click", () => applyFilter(btn.dataset.filter)));
  applyFilter("open");
})();
