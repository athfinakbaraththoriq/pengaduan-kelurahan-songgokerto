/* =========================================================
   PENGADUAN MASYARAKAT KELURAHAN SONGGOKERTO
   script.js — JavaScript Vanilla (tanpa framework/backend)
   ========================================================= */

// Ganti dengan nomor WhatsApp resmi Kelurahan Songgokerto (format 62xxxxxxxxxxx, tanpa "+" atau "0" di depan)
const nomorWhatsApp = "6285713889484";

/**
 * Membuka chat WhatsApp langsung ke nomor resmi dengan pesan yang sudah terisi.
 * Catatan: WhatsApp Click-to-Chat hanya bisa MEMBUKA chat + MENGISI teks secara
 * otomatis. Tombol "Kirim" di dalam WhatsApp tetap harus ditekan oleh pengguna —
 * ini batasan resmi dari WhatsApp, bukan sesuatu yang bisa dilewati dari website
 * statis tanpa WhatsApp Business API (butuh server & akun bisnis terverifikasi).
 * Fungsi ini memastikan link terbuka seandal mungkin di HP maupun desktop.
 */
function bukaWhatsApp(nomor, pesan) {
  const teks = encodeURIComponent(pesan);
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

  // api.whatsapp.com lebih konsisten membuka langsung ke app WhatsApp di HP,
  // sedangkan wa.me lebih stabil untuk WhatsApp Web di desktop.
  const url = isMobile
    ? `https://api.whatsapp.com/send?phone=${nomor}&text=${teks}`
    : `https://wa.me/${nomor}?text=${teks}`;

  if (isMobile) {
    // Di HP, window.open ke tab baru sering diblokir/ditutup begitu app WhatsApp
    // dibuka. Navigasi langsung di tab yang sama jauh lebih andal.
    window.location.href = url;
  } else {
    const tab = window.open(url, "_blank", "noopener");
    // Fallback jika popup diblokir oleh browser desktop.
    if (!tab) window.location.href = url;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     1. NAVBAR: sticky shadow + hamburger menu
     ========================================================= */
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("is-scrolled", window.scrollY > 8);
    toggleBackToTop();
  });

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Tutup menu mobile ketika salah satu link diklik
  navMenu.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* =========================================================
     2. SMOOTH SCROLLING untuk semua anchor link internal
     ========================================================= */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: offset, behavior: "smooth" });
    });
  });

  /* =========================================================
     3. BACK TO TOP
     ========================================================= */
  const backToTop = document.getElementById("backToTop");
  function toggleBackToTop() {
    backToTop.hidden = window.scrollY < 500;
  }
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* =========================================================
     4. SCROLL REVEAL sederhana (fade-in ketika section muncul)
     ========================================================= */
  const revealTargets = document.querySelectorAll(
    ".stat-card, .category-card, .step-card, .status-node, .form-card, .contact-card, .contact-map"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* =========================================================
     5. COUNTER ANIMASI untuk statistik (data dummy)
     ========================================================= */
  const statNumbers = document.querySelectorAll(".stat-card__number");
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  statNumbers.forEach((el) => statObserver.observe(el));

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 900;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* =========================================================
     6. KATEGORI: klik kategori otomatis mengisi form
     ========================================================= */
  const categoryCards = document.querySelectorAll(".category-card");
  const kategoriSelect = document.getElementById("kategori");

  categoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      categoryCards.forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      kategoriSelect.value = card.dataset.category;
      clearFieldError("kategori");
      document.getElementById("form-pengaduan").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Jika kategori diubah manual lewat select, sinkronkan kartu terpilih
  kategoriSelect.addEventListener("change", () => {
    categoryCards.forEach((c) => {
      c.classList.toggle("is-selected", c.dataset.category === kategoriSelect.value);
    });
    clearFieldError("kategori");
  });

  /* =========================================================
     7. UPLOAD & PREVIEW GAMBAR (tanpa upload ke server)
     ========================================================= */
  const buktiInput = document.getElementById("bukti");
  const previewGrid = document.getElementById("previewGrid");
  const uploadBox = document.getElementById("uploadBox");
  const MAX_FILES = 3;
  let selectedFiles = [];

  buktiInput.addEventListener("change", (e) => {
    handleFiles(Array.from(e.target.files));
  });

  ["dragover", "dragenter"].forEach((evt) => {
    uploadBox.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadBox.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    uploadBox.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadBox.classList.remove("is-dragover");
    });
  });
  uploadBox.addEventListener("drop", (e) => {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    handleFiles(files);
  });

  function handleFiles(files) {
    const room = MAX_FILES - selectedFiles.length;
    if (room <= 0) {
      showToast("Maksimal 3 gambar dapat ditambahkan.", true);
      return;
    }
    const toAdd = files.slice(0, room);
    if (files.length > room) {
      showToast(`Hanya ${room} gambar tambahan yang dapat dimasukkan (maksimal 3).`, true);
    }
    toAdd.forEach((file) => {
      selectedFiles.push(file);
      renderPreview(file);
    });
  }

  function renderPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement("div");
      item.className = "preview-item";
      item.innerHTML = `
        <img src="${e.target.result}" alt="Pratinjau bukti pendukung: ${escapeHtml(file.name)}">
        <button type="button" class="preview-item__remove" aria-label="Hapus gambar ${escapeHtml(file.name)}">&times;</button>
      `;
      item.querySelector(".preview-item__remove").addEventListener("click", () => {
        selectedFiles = selectedFiles.filter((f) => f !== file);
        item.remove();
      });
      previewGrid.appendChild(item);
    };
    reader.readAsDataURL(file);
  }

  /* =========================================================
     8. VALIDASI FORM
     ========================================================= */
  const form = document.getElementById("complaintForm");
  const fields = ["nama", "whatsapp", "alamat", "kategori", "judul", "deskripsi", "lokasi"];

  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`err-${fieldId}`);
    input.closest(".form-field").classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
  }

  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`err-${fieldId}`);
    input.closest(".form-field").classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    errorEl.textContent = "";
  }

  fields.forEach((id) => {
    document.getElementById(id).addEventListener("input", () => clearFieldError(id));
  });

  function validateForm() {
    let isValid = true;
    fields.forEach(clearFieldError);

    const nama = document.getElementById("nama").value.trim();
    if (nama.length < 3) {
      showFieldError("nama", "Nama wajib diisi (minimal 3 huruf).");
      isValid = false;
    }

    const whatsapp = document.getElementById("whatsapp").value.trim();
    const waDigits = whatsapp.replace(/[^0-9]/g, "");
    if (!/^0[0-9]{9,14}$/.test(waDigits) && !whatsapp.startsWith("+")) {
      if (waDigits.length < 10 || !whatsapp.startsWith("0")) {
        showFieldError("whatsapp", "Masukkan nomor WhatsApp yang valid, contoh: 08123456789.");
        isValid = false;
      }
    }

    const alamat = document.getElementById("alamat").value.trim();
    if (alamat.length < 5) {
      showFieldError("alamat", "Alamat wajib diisi dengan lengkap.");
      isValid = false;
    }

    const kategori = document.getElementById("kategori").value;
    if (!kategori) {
      showFieldError("kategori", "Silakan pilih kategori pengaduan.");
      isValid = false;
    }

    const judul = document.getElementById("judul").value.trim();
    if (judul.length < 5) {
      showFieldError("judul", "Judul pengaduan wajib diisi (minimal 5 huruf).");
      isValid = false;
    }

    const deskripsi = document.getElementById("deskripsi").value.trim();
    if (deskripsi.length < 15) {
      showFieldError("deskripsi", "Jelaskan permasalahan secara lengkap (minimal 15 huruf).");
      isValid = false;
    }

    const lokasi = document.getElementById("lokasi").value.trim();
    if (lokasi.length < 3) {
      showFieldError("lokasi", "Lokasi kejadian wajib diisi.");
      isValid = false;
    }

    return isValid;
  }

  /* =========================================================
     9. MODAL KONFIRMASI
     ========================================================= */
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBackBtn = document.getElementById("modalBackBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  let lastFocusedElement = null;

  function openModal() {
    document.getElementById("sum-nama").textContent = document.getElementById("nama").value.trim();
    document.getElementById("sum-kategori").textContent = document.getElementById("kategori").value;
    document.getElementById("sum-judul").textContent = document.getElementById("judul").value.trim();
    document.getElementById("sum-lokasi").textContent = document.getElementById("lokasi").value.trim();
    const prioritas = form.querySelector('input[name="prioritas"]:checked').value;
    document.getElementById("sum-prioritas").textContent = prioritas;

    lastFocusedElement = document.activeElement;
    modalOverlay.hidden = false;
    modalBackBtn.focus();
    document.addEventListener("keydown", handleModalKeydown);
  }

  function closeModal() {
    modalOverlay.hidden = true;
    document.removeEventListener("keydown", handleModalKeydown);
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleModalKeydown(e) {
    if (e.key === "Escape") closeModal();
    // Jaga fokus tetap berada di dalam modal (focus trap sederhana)
    if (e.key === "Tab") {
      const focusables = modalOverlay.querySelectorAll("button");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  modalBackBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* =========================================================
     10. SUBMIT FORM -> VALIDASI -> MODAL -> WHATSAPP
     ========================================================= */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Mohon lengkapi data yang belum sesuai pada formulir.", true);
      const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
      if (firstError) firstError.focus();
      return;
    }
    openModal();
  });

  modalConfirmBtn.addEventListener("click", () => {
    kirimKeWhatsApp();
    closeModal();
  });

  function kirimKeWhatsApp() {
    const nama = document.getElementById("nama").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.trim();
    const alamat = document.getElementById("alamat").value.trim();
    const kategori = document.getElementById("kategori").value;
    const judul = document.getElementById("judul").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();
    const lokasi = document.getElementById("lokasi").value.trim();
    const prioritas = form.querySelector('input[name="prioritas"]:checked').value;
    const bersedia = document.getElementById("bersedia").checked ? "Ya" : "Tidak";

    // Mengambil tanggal & waktu pengaduan secara otomatis
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    const waktu = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const catatanFoto = selectedFiles.length > 0
      ? `${selectedFiles.length} foto bukti akan dilampirkan langsung melalui WhatsApp.`
      : "Tidak ada foto bukti yang dilampirkan.";

    const pesan =
`PENGADUAN MASYARAKAT
KELURAHAN SONGGOKERTO

Nama: ${nama}
Nomor WhatsApp: ${whatsapp}
Alamat: ${alamat}

Kategori: ${kategori}
Judul Pengaduan: ${judul}

Deskripsi:
${deskripsi}

Lokasi Kejadian: ${lokasi}

Prioritas: ${prioritas}

Bersedia Dihubungi: ${bersedia}

Bukti Pendukung: ${catatanFoto}

Tanggal Pengaduan: ${tanggal}, ${waktu} WIB`;

    bukaWhatsApp(nomorWhatsApp, pesan);

    showToast("Pengaduan siap dikirim. Silakan tekan tombol Kirim di WhatsApp untuk menyelesaikan.");
  }

  /* =========================================================
     11. RESET FORM
     ========================================================= */
  document.getElementById("resetFormBtn").addEventListener("click", () => {
    form.reset();
    fields.forEach(clearFieldError);
    categoryCards.forEach((c) => c.classList.remove("is-selected"));
    selectedFiles = [];
    previewGrid.innerHTML = "";
    showToast("Formulir telah direset.");
  });

  /* =========================================================
     12. TOMBOL LACAK PENGADUAN (belum tersedia — jujur ke pengguna)
     ========================================================= */
  const trackingBtn = document.getElementById("trackingBtn");
  const trackingText = document.getElementById("trackingText");
  trackingBtn.addEventListener("click", () => {
    trackingText.hidden = !trackingText.hidden;
  });

  /* =========================================================
     13. FAQ ACCORDION
     ========================================================= */
  document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = trigger.parentElement.nextElementSibling;
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      // Tutup accordion lain (perilaku single-open agar rapi di mobile)
      document.querySelectorAll(".accordion-trigger").forEach((t) => {
        if (t !== trigger) {
          t.setAttribute("aria-expanded", "false");
          t.parentElement.nextElementSibling.style.maxHeight = null;
        }
      });

      trigger.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? null : `${panel.scrollHeight}px`;
    });
  });

  /* =========================================================
     14. TOMBOL CHAT WHATSAPP DI KONTAK
     ========================================================= */
  document.getElementById("contactWhatsappBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const pesan = "Halo, saya ingin bertanya seputar layanan pengaduan masyarakat Kelurahan Songgokerto.";
    bukaWhatsApp(nomorWhatsApp, pesan);
  });

  /* =========================================================
     15. TOAST NOTIFIKASI
     ========================================================= */
  const toast = document.getElementById("toast");
  let toastTimeout;
  function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.toggle("toast--error", isError);
    toast.hidden = false;
    toastTimeout = setTimeout(() => {
      toast.hidden = true;
    }, 3800);
  }

  /* =========================================================
     16. UTIL: escape HTML sederhana (mencegah XSS pada pratinjau)
     ========================================================= */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  toggleBackToTop();
});
