/* ============================================================
   connfig — v1 interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 현재 연도 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 모바일 내비게이션 ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 고객 분기 → 문의 폼 범위 자동 선택 ---------- */
  document.querySelectorAll(".branch-card .branch-link").forEach(function (link) {
    link.addEventListener("click", function () {
      var scope = link.closest(".branch-card").getAttribute("data-scope");
      var input = document.querySelector('input[name="scope"][value="' + scope + '"]');
      if (input) {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  /* ---------- 문의 폼 처리 ----------
     v1은 정적 사이트라 백엔드가 없습니다.
     실제 발송은 Formspree / Google Form / 자체 API 중 하나로 연결하세요.
     현재는 입력값을 검증하고 안내 메시지를 보여줍니다.
  -------------------------------------------------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var type = data.get("type");
      var scope = data.get("scope");
      var note = (data.get("note") || "").toString().trim();

      if (!type) { setStatus("공간 유형을 선택해 주세요.", false); return; }
      if (!scope) { setStatus("원하는 범위를 선택해 주세요.", false); return; }
      if (!note) { setStatus("한 줄 고민을 적어 주세요.", false); return; }

      // 실제 연동 전까지의 임시 동작: 안내 + 초기화
      setStatus("보내주셔서 감사합니다. 곧 connfig가 연락드리겠습니다.", true);
      form.reset();
    });
  }

  function setStatus(msg, ok) {
    status.textContent = msg;
    status.classList.toggle("ok", !!ok);
  }
})();
