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

  /* ---------- 공간 유형 "기타" 직접입력 ---------- */
  var typeOther = document.getElementById("typeOther");
  document.querySelectorAll('input[name="type"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (!typeOther) return;
      var isOther = radio.value === "기타" && radio.checked;
      typeOther.hidden = !isOther;
      if (isOther) {
        typeOther.focus();
      } else {
        typeOther.value = "";
      }
    });
  });

  /* ---------- 첨부 이미지: 압축 + 미리보기 ---------- */
  var MAX_PHOTOS = 5;
  var MAX_DIMENSION = 1600; // px
  var JPEG_QUALITY = 0.72;
  var compressedPhotos = []; // [{ name, blob, url }]

  var fileInput = document.getElementById("photos");
  var fileDrop = document.getElementById("fileDrop");
  var filePreviews = document.getElementById("filePreviews");

  function compressImage(file) {
    return new Promise(function (resolve) {
      var img = new Image();
      var objectUrl = URL.createObjectURL(file);
      img.onload = function () {
        var ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(objectUrl);
          resolve(blob || file);
        }, "image/jpeg", JPEG_QUALITY);
      };
      img.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function renderPreviews() {
    if (!filePreviews) return;
    filePreviews.innerHTML = "";
    compressedPhotos.forEach(function (photo, index) {
      var item = document.createElement("div");
      item.className = "file-preview-item";

      var img = document.createElement("img");
      img.src = photo.url;
      img.alt = photo.name;
      item.appendChild(img);

      var size = document.createElement("span");
      size.className = "file-preview-size";
      size.textContent = formatSize(photo.blob.size);
      item.appendChild(size);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "file-preview-remove";
      remove.setAttribute("aria-label", "이미지 삭제");
      remove.textContent = "×";
      remove.addEventListener("click", function () {
        URL.revokeObjectURL(photo.url);
        compressedPhotos.splice(index, 1);
        renderPreviews();
      });
      item.appendChild(remove);

      filePreviews.appendChild(item);
    });
  }

  if (fileInput && fileDrop) {
    fileInput.addEventListener("change", function () {
      handleFiles(fileInput.files);
      fileInput.value = "";
    });

    ["dragover", "dragleave", "drop"].forEach(function (eventName) {
      fileDrop.addEventListener(eventName, function (e) {
        e.preventDefault();
        fileDrop.classList.toggle("is-dragover", eventName === "dragover");
        if (eventName === "drop" && e.dataTransfer) {
          handleFiles(e.dataTransfer.files);
        }
      });
    });
  }

  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []).filter(function (f) {
      return f.type.indexOf("image/") === 0;
    });

    var room = MAX_PHOTOS - compressedPhotos.length;
    if (room <= 0) {
      setStatus("이미지는 최대 " + MAX_PHOTOS + "장까지 첨부할 수 있어요.", false);
      return;
    }
    files = files.slice(0, room);

    Promise.all(files.map(function (file) { return compressImage(file); })).then(function (blobs) {
      blobs.forEach(function (blob, i) {
        compressedPhotos.push({
          name: files[i].name,
          blob: blob,
          url: URL.createObjectURL(blob)
        });
      });
      renderPreviews();
    });
  }

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
      var typeOtherValue = (data.get("typeOther") || "").toString().trim();

      if (!type) { setStatus("공간 유형을 선택해 주세요.", false); return; }
      if (type === "기타" && !typeOtherValue) { setStatus("공간 유형을 직접 입력해 주세요.", false); return; }
      if (!scope) { setStatus("원하는 범위를 선택해 주세요.", false); return; }
      if (!note) { setStatus("고민 또는 요청사항을 적어 주세요.", false); return; }

      // 실제 연동 전까지의 임시 동작: 안내 + 초기화
      setStatus("보내주셔서 감사합니다. 곧 connfig가 연락드리겠습니다.", true);
      form.reset();
      if (typeOther) typeOther.hidden = true;
      compressedPhotos.forEach(function (photo) { URL.revokeObjectURL(photo.url); });
      compressedPhotos = [];
      renderPreviews();
    });
  }

  function setStatus(msg, ok) {
    status.textContent = msg;
    status.classList.toggle("ok", !!ok);
  }
})();
