/* ============================================================
   connfig — v1 interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 문의 폼 전송 주소 ----------
     Formspree(https://formspree.io)에서 무료로 폼을 만들면
     "https://formspree.io/f/xxxxxxxx" 형태의 주소를 받습니다.
     그 주소를 아래 빈 칸에 넣으면 문의 폼이 실제로 작동합니다.
     비워두면(="") 화면에는 정상처럼 보이지만 실제로는 전송되지 않습니다.
  -------------------------------------------------- */
  var FORM_ENDPOINT = "";

  /* ---------- 현재 연도 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- PDF로 받기 (브라우저 인쇄 기능 이용) ---------- */
  var printDateEl = document.getElementById("printDate");
  if (printDateEl) {
    var today = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    printDateEl.textContent = "Generated " + today.getFullYear() + "." + pad(today.getMonth() + 1) + "." + pad(today.getDate());
  }

  var pdfBtn = document.getElementById("pdfExportBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", function () {
      window.print();
    });
  }

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

  /* ---------- 문의 폼 처리 ---------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

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

      // 폼 기본 사진 입력값 대신, 압축된 이미지를 첨부
      data.delete("photos");
      compressedPhotos.forEach(function (photo, i) {
        data.append("photo" + (i + 1), photo.blob, photo.name);
      });

      if (!FORM_ENDPOINT) {
        // 전송 주소가 아직 설정되지 않은 경우: 안내 + 초기화만 수행
        setStatus("보내주셔서 감사합니다. 곧 connfig가 연락드리겠습니다.", true);
        resetForm();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus("전송 중입니다...", true);

      fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            setStatus("보내주셔서 감사합니다. 곧 connfig가 연락드리겠습니다.", true);
            resetForm();
          } else {
            setStatus("전송에 실패했어요. 잠시 후 다시 시도해 주세요.", false);
          }
        })
        .catch(function () {
          setStatus("전송에 실패했어요. 네트워크 상태를 확인해 주세요.", false);
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  function resetForm() {
    form.reset();
    if (typeOther) typeOther.hidden = true;
    compressedPhotos.forEach(function (photo) { URL.revokeObjectURL(photo.url); });
    compressedPhotos = [];
    renderPreviews();
  }

  function setStatus(msg, ok) {
    status.textContent = msg;
    status.classList.toggle("ok", !!ok);
  }
})();
