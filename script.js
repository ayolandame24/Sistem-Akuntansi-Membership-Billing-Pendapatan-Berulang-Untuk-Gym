/* =========================================================
   GYMFLOW
   DIRECT SUPABASE
   TANPA APP.JS
========================================================= */


/* =========================================================
   1. KONFIGURASI SUPABASE
========================================================= */

// GANTI BAGIAN INI DENGAN DATA SUPABASE KAMU

const SUPABASE_URL = "https://dqtfoctyvehsghynexym.supabase.co";

const SUPABASE_KEY = "sb_publishable_NCSjZNRigNCfUJO2T1EANA_2cg-EtwY";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   2. GLOBAL DATA
========================================================= */

let memberData = [];
let membershipData = [];
let paymentData = [];


/* =========================================================
   3. HELPER
========================================================= */

function formatRupiah(value) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(value) || 0);

}


function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const day =
        String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function getInitials(name) {

    if (!name) {
        return "?";
    }

    const words = name.trim().split(" ");

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


function escapeHtml(text) {

    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   4. TOAST
========================================================= */

let toastTimer;

function showToast(
    title,
    message,
    type = "success"
) {

    const toast =
        document.getElementById("toast");

    const titleElement =
        document.getElementById("toastTitle");

    const messageElement =
        document.getElementById("toastMessage");

    const icon =
        toast.querySelector(".toast-icon");


    titleElement.textContent = title;

    messageElement.textContent = message;


    if (type === "error") {

        icon.textContent = "!";

        icon.style.background = "#eb5757";

    } else {

        icon.textContent = "✓";

        icon.style.background = "#20bf6b";

    }


    toast.classList.add("show");


    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


/* =========================================================
   5. NAVIGATION
========================================================= */

const pageNames = {
    dashboard: "Dashboard",
    member: "Data Member",
    membership: "Membership",
    pembayaran: "Pembayaran"
};


function showPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {

        page.classList.remove("active-page");

    });


    const selectedPage =
        document.getElementById(
            `page-${pageName}`
        );


    if (selectedPage) {

        selectedPage.classList.add("active-page");

    }


    document.querySelectorAll(".nav-item").forEach(item => {

        item.classList.remove("active");

    });


    const selectedNav =
        document.querySelector(
            `.nav-item[data-page="${pageName}"]`
        );


    if (selectedNav) {

        selectedNav.classList.add("active");

    }


    const title =
        pageNames[pageName] || "Dashboard";


    document.getElementById(
        "pageTitle"
    ).textContent = title;


    document.getElementById(
        "breadcrumbText"
    ).textContent = title;

}


function setupNavigation() {

    document.querySelectorAll(".nav-item").forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page;

            showPage(page);

        });

    });

}


/* =========================================================
   6. LOAD ALL DATA
========================================================= */

async function loadAllData() {

    try {

        await Promise.all([
            loadMembers(),
            loadMemberships(),
            loadPayments()
        ]);

        updateDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            "Gagal",
            "Tidak dapat mengambil data dari Supabase.",
            "error"
        );

    }

}


/* =========================================================
   7. LOAD MEMBER
========================================================= */

async function loadMembers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("member")
        .select("*")
        .order("id_member", {
            ascending: false
        });


    if (error) {

        console.error(
            "Error member:",
            error
        );

        throw error;

    }


    memberData = data || [];

    renderMemberTable();

    populateMemberSelect();

}


/* =========================================================
   8. LOAD MEMBERSHIP
========================================================= */

async function loadMemberships() {

    const {
        data,
        error
    } = await supabaseClient
        .from("membership")
        .select(`
            *,
            member (
                nama_member
            )
        `)
        .order("id_membership", {
            ascending: false
        });


    if (error) {

        console.error(
            "Error membership:",
            error
        );

        throw error;

    }


    membershipData = data || [];

    renderMembershipTable();

    populatePaymentMembershipSelect();

}


/* =========================================================
   9. LOAD PEMBAYARAN
========================================================= */

async function loadPayments() {

    const {
        data,
        error
    } = await supabaseClient
        .from("pembayaran")
        .select(`
            *,
            membership (
                jenis_paket,
                member (
                    nama_member
                )
            )
        `)
        .order("id_pembayaran", {
            ascending: false
        });


    if (error) {

        console.error(
            "Error pembayaran:",
            error
        );

        throw error;

    }


    paymentData = data || [];

    renderPaymentTable();

}


/* =========================================================
   10. DASHBOARD
========================================================= */

function updateDashboard() {

    const totalMember =
        memberData.length;


    const activeMembership =
        membershipData.filter(
            item => item.status === "Aktif"
        ).length;


    const totalTransaction =
        paymentData.length;


    const totalRevenue =
        paymentData
            .filter(
                item =>
                    item.status_pembayaran === "Lunas"
            )
            .reduce(
                (total, item) =>
                    total + Number(item.jumlah_bayar || 0),
                0
            );


    document.getElementById(
        "totalMember"
    ).textContent = totalMember;


    document.getElementById(
        "activeMembership"
    ).textContent = activeMembership;


    document.getElementById(
        "totalTransaction"
    ).textContent = totalTransaction;


    document.getElementById(
        "totalRevenue"
    ).textContent =
        formatRupiah(totalRevenue);


    renderRecentPayments();

    renderActiveMembership();

}


/* =========================================================
   11. RECENT PAYMENT
========================================================= */

function renderRecentPayments() {

    const tbody =
        document.getElementById(
            "recentPaymentTable"
        );


    const recent =
        paymentData.slice(0, 5);


    if (recent.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    Belum ada transaksi pembayaran.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        recent.map(payment => {

            const memberName =
                payment.membership?.member?.nama_member
                || "-";


            const statusClass =
                payment.status_pembayaran === "Lunas"
                    ? "badge-paid"
                    : "badge-unpaid";


            return `
                <tr>

                    <td>
                        <div class="member-name">
                            ${escapeHtml(memberName)}
                        </div>
                    </td>

                    <td>
                        ${escapeHtml(payment.periode_bayar)}
                    </td>

                    <td class="amount">
                        ${formatRupiah(payment.jumlah_bayar)}
                    </td>

                    <td>
                        <span class="badge ${statusClass}">
                            ${escapeHtml(payment.status_pembayaran)}
                        </span>
                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   12. ACTIVE MEMBERSHIP DASHBOARD
========================================================= */

function renderActiveMembership() {

    const container =
        document.getElementById(
            "activeMembershipList"
        );


    const active =
        membershipData
            .filter(
                item =>
                    item.status === "Aktif"
            )
            .slice(0, 5);


    if (active.length === 0) {

        container.innerHTML = `
            <div class="loading-box">
                Belum ada membership aktif.
            </div>
        `;

        return;

    }


    container.innerHTML =
        active.map(item => {

            const name =
                item.member?.nama_member || "-";


            return `
                <div class="membership-item">

                    <div class="membership-person">

                        <div class="person-avatar">
                            ${escapeHtml(getInitials(name))}
                        </div>

                        <div>
                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <span>
                                ${escapeHtml(item.jenis_paket)}
                            </span>
                        </div>

                    </div>


                    <div class="membership-date">

                        <strong>
                            ${formatDate(item.tanggal_berakhir)}
                        </strong>

                        <span>
                            Berakhir
                        </span>

                    </div>

                </div>
            `;

        }).join("");

}


/* =========================================================
   13. MEMBER TABLE
========================================================= */

function renderMemberTable() {

    const tbody =
        document.getElementById(
            "memberTableBody"
        );


    if (!tbody) {
        return;
    }


    const search =
        (
            document.getElementById(
                "memberSearch"
            )?.value || ""
        )
        .toLowerCase();


    const status =
        document.getElementById(
            "memberStatusFilter"
        )?.value || "";


    const filtered =
        memberData.filter(member => {

            const matchesSearch =
                (
                    member.nama_member || ""
                )
                .toLowerCase()
                .includes(search)
                ||
                (
                    member.email || ""
                )
                .toLowerCase()
                .includes(search)
                ||
                (
                    member.no_telepon || ""
                )
                .toLowerCase()
                .includes(search);


            const matchesStatus =
                !status ||
                member.status === status;


            return matchesSearch &&
                   matchesStatus;

        });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    Data member tidak ditemukan.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        filtered.map(member => {

            const badgeClass =
                member.status === "Aktif"
                    ? "badge-active"
                    : "badge-expired";


            return `
                <tr>

                    <td>
                        #${member.id_member}
                    </td>

                    <td>
                        <div class="member-name">
                            ${escapeHtml(member.nama_member)}
                        </div>

                        <div class="member-sub">
                            ${escapeHtml(member.alamat || "-")}
                        </div>
                    </td>

                    <td>
                        ${escapeHtml(member.jenis_kelamin || "-")}
                    </td>

                    <td>
                        ${escapeHtml(member.no_telepon || "-")}
                    </td>

                    <td>
                        ${escapeHtml(member.email || "-")}
                    </td>

                    <td>
                        ${formatDate(member.tanggal_daftar)}
                    </td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(member.status)}
                        </span>
                    </td>

                    <td>

                        <div class="action-buttons">

                            <button
                                class="action-button edit"
                                title="Edit"
                                onclick="editMember(${member.id_member})"
                            >
                                ✎
                            </button>

                            <button
                                class="action-button delete"
                                title="Hapus"
                                onclick="deleteMember(${member.id_member})"
                            >
                                ×
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   14. MEMBER MODAL
========================================================= */

function openMemberModal(id = null) {

    const modal =
        document.getElementById(
            "memberModal"
        );


    const form =
        document.getElementById(
            "memberForm"
        );


    form.reset();


    document.getElementById(
        "memberId"
    ).value = "";


    document.getElementById(
        "memberDate"
    ).value = getToday();


    document.getElementById(
        "memberStatus"
    ).value = "Aktif";


    document.getElementById(
        "memberModalTitle"
    ).textContent =
        "Tambah Member";


    if (id !== null) {

        const member =
            memberData.find(
                item =>
                    Number(item.id_member) === Number(id)
            );


        if (!member) {
            return;
        }


        document.getElementById(
            "memberModalTitle"
        ).textContent =
            "Edit Member";


        document.getElementById(
            "memberId"
        ).value =
            member.id_member;


        document.getElementById(
            "memberNama"
        ).value =
            member.nama_member || "";


        document.getElementById(
            "memberGender"
        ).value =
            member.jenis_kelamin || "";


        document.getElementById(
            "memberPhone"
        ).value =
            member.no_telepon || "";


        document.getElementById(
            "memberEmail"
        ).value =
            member.email || "";


        document.getElementById(
            "memberAddress"
        ).value =
            member.alamat || "";


        document.getElementById(
            "memberDate"
        ).value =
            member.tanggal_daftar;


        document.getElementById(
            "memberStatus"
        ).value =
            member.status;

    }


    modal.classList.add("show");

}


function closeMemberModal() {

    document
        .getElementById("memberModal")
        .classList.remove("show");

}


/* =========================================================
   15. SAVE MEMBER
========================================================= */

document
    .getElementById("memberForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const id =
            document.getElementById(
                "memberId"
            ).value;


        const payload = {

            nama_member:
                document.getElementById(
                    "memberNama"
                ).value.trim(),

            jenis_kelamin:
                document.getElementById(
                    "memberGender"
                ).value,

            no_telepon:
                document.getElementById(
                    "memberPhone"
                ).value.trim(),

            email:
                document.getElementById(
                    "memberEmail"
                ).value.trim(),

            alamat:
                document.getElementById(
                    "memberAddress"
                ).value.trim(),

            tanggal_daftar:
                document.getElementById(
                    "memberDate"
                ).value,

            status:
                document.getElementById(
                    "memberStatus"
                ).value

        };


        let error;


        if (id) {

            const result =
                await supabaseClient
                    .from("member")
                    .update(payload)
                    .eq("id_member", id);

            error = result.error;

        } else {

            const result =
                await supabaseClient
                    .from("member")
                    .insert([payload]);

            error = result.error;

        }


        if (error) {

            console.error(error);

            showToast(
                "Gagal",
                error.message,
                "error"
            );

            return;

        }


        closeMemberModal();


        showToast(
            "Berhasil",
            id
                ? "Data member berhasil diperbarui."
                : "Member baru berhasil ditambahkan."
        );


        await loadMembers();

        updateDashboard();

    });


/* =========================================================
   16. EDIT MEMBER
========================================================= */

function editMember(id) {

    openMemberModal(id);

}


/* =========================================================
   17. DELETE MEMBER
========================================================= */

async function deleteMember(id) {

    const member =
        memberData.find(
            item =>
                Number(item.id_member) === Number(id)
        );


    if (!member) {
        return;
    }


    const confirmed =
        confirm(
            `Hapus member "${member.nama_member}"?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("member")
        .delete()
        .eq("id_member", id);


    if (error) {

        console.error(error);

        showToast(
            "Gagal",
            error.message,
            "error"
        );

        return;

    }


    showToast(
        "Berhasil",
        "Member berhasil dihapus."
    );


    await loadAllData();

}


/* =========================================================
   18. POPULATE MEMBER SELECT
========================================================= */

function populateMemberSelect() {

    const select =
        document.getElementById(
            "membershipMember"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Pilih member
        </option>
    `;


    memberData.forEach(member => {

        select.innerHTML += `
            <option value="${member.id_member}">
                ${escapeHtml(member.nama_member)}
            </option>
        `;

    });

}


/* =========================================================
   19. MEMBERSHIP TABLE
========================================================= */

function renderMembershipTable() {

    const tbody =
        document.getElementById(
            "membershipTableBody"
        );


    if (!tbody) {
        return;
    }


    const search =
        (
            document.getElementById(
                "membershipSearch"
            )?.value || ""
        )
        .toLowerCase();


    const status =
        document.getElementById(
            "membershipStatusFilter"
        )?.value || "";


    const filtered =
        membershipData.filter(item => {

            const memberName =
                item.member?.nama_member || "";


            const matchesSearch =
                memberName
                    .toLowerCase()
                    .includes(search)
                ||
                (
                    item.jenis_paket || ""
                )
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                !status ||
                item.status === status;


            return matchesSearch &&
                   matchesStatus;

        });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    Data membership tidak ditemukan.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        filtered.map(item => {

            let badgeClass =
                "badge-expired";


            if (item.status === "Aktif") {
                badgeClass = "badge-active";
            }

            if (item.status === "Dibatalkan") {
                badgeClass = "badge-cancelled";
            }


            const memberName =
                item.member?.nama_member || "-";


            return `
                <tr>

                    <td>
                        #${item.id_membership}
                    </td>

                    <td>
                        <div class="member-name">
                            ${escapeHtml(memberName)}
                        </div>
                    </td>

                    <td>
                        ${escapeHtml(item.jenis_paket)}
                    </td>

                    <td>
                        ${formatDate(item.tanggal_mulai)}
                    </td>

                    <td>
                        ${formatDate(item.tanggal_berakhir)}
                    </td>

                    <td class="amount">
                        ${formatRupiah(item.harga)}
                    </td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(item.status)}
                        </span>
                    </td>

                    <td>

                        <div class="action-buttons">

                            <button
                                class="action-button edit"
                                title="Edit"
                                onclick="editMembership(${item.id_membership})"
                            >
                                ✎
                            </button>

                            <button
                                class="action-button delete"
                                title="Hapus"
                                onclick="deleteMembership(${item.id_membership})"
                            >
                                ×
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   20. MEMBERSHIP MODAL
========================================================= */

function openMembershipModal(id = null) {

    const form =
        document.getElementById(
            "membershipForm"
        );


    form.reset();


    document.getElementById(
        "membershipId"
    ).value = "";


    document.getElementById(
        "membershipStart"
    ).value = getToday();


    document.getElementById(
        "membershipStatus"
    ).value = "Aktif";


    document.getElementById(
        "membershipModalTitle"
    ).textContent =
        "Tambah Membership";


    if (id !== null) {

        const item =
            membershipData.find(
                membership =>
                    Number(
                        membership.id_membership
                    ) === Number(id)
            );


        if (!item) {
            return;
        }


        document.getElementById(
            "membershipModalTitle"
        ).textContent =
            "Edit Membership";


        document.getElementById(
            "membershipId"
        ).value =
            item.id_membership;


        document.getElementById(
            "membershipMember"
        ).value =
            item.id_member;


        document.getElementById(
            "membershipPackage"
        ).value =
            item.jenis_paket;


        document.getElementById(
            "membershipStart"
        ).value =
            item.tanggal_mulai;


        document.getElementById(
            "membershipEnd"
        ).value =
            item.tanggal_berakhir;


        document.getElementById(
            "membershipPrice"
        ).value =
            item.harga;


        document.getElementById(
            "membershipStatus"
        ).value =
            item.status;

    }


    document
        .getElementById("membershipModal")
        .classList.add("show");

}


function closeMembershipModal() {

    document
        .getElementById("membershipModal")
        .classList.remove("show");

}


/* =========================================================
   21. AUTO DATE MEMBERSHIP
========================================================= */

function calculateEndDate() {

    const startValue =
        document.getElementById(
            "membershipStart"
        ).value;


    const packageValue =
        document.getElementById(
            "membershipPackage"
        ).value;


    if (!startValue || !packageValue) {
        return;
    }


    const date =
        new Date(
            startValue + "T00:00:00"
        );


    if (packageValue === "Harian") {

        date.setDate(
            date.getDate()
        );

    }

    else if (packageValue === "Bulanan") {

        date.setMonth(
            date.getMonth() + 1
        );

        date.setDate(
            date.getDate() - 1
        );

    }

    else if (packageValue === "3 Bulan") {

        date.setMonth(
            date.getMonth() + 3
        );

        date.setDate(
            date.getDate() - 1
        );

    }

    else if (packageValue === "6 Bulan") {

        date.setMonth(
            date.getMonth() + 6
        );

        date.setDate(
            date.getDate() - 1
        );

    }

    else if (packageValue === "Tahunan") {

        date.setFullYear(
            date.getFullYear() + 1
        );

        date.setDate(
            date.getDate() - 1
        );

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    document.getElementById(
        "membershipEnd"
    ).value =
        `${year}-${month}-${day}`;

}


/* =========================================================
   22. SAVE MEMBERSHIP
========================================================= */

document
    .getElementById("membershipForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const id =
            document.getElementById(
                "membershipId"
            ).value;


        const payload = {

            id_member:
                Number(
                    document.getElementById(
                        "membershipMember"
                    ).value
                ),

            jenis_paket:
                document.getElementById(
                    "membershipPackage"
                ).value,

            tanggal_mulai:
                document.getElementById(
                    "membershipStart"
                ).value,

            tanggal_berakhir:
                document.getElementById(
                    "membershipEnd"
                ).value,

            harga:
                Number(
                    document.getElementById(
                        "membershipPrice"
                    ).value
                ),

            status:
                document.getElementById(
                    "membershipStatus"
                ).value

        };


        let error;


        if (id) {

            const result =
                await supabaseClient
                    .from("membership")
                    .update(payload)
                    .eq(
                        "id_membership",
                        id
                    );

            error = result.error;

        } else {

            const result =
                await supabaseClient
                    .from("membership")
                    .insert([payload]);

            error = result.error;

        }


        if (error) {

            console.error(error);

            showToast(
                "Gagal",
                error.message,
                "error"
            );

            return;

        }


        closeMembershipModal();


        showToast(
            "Berhasil",
            id
                ? "Membership berhasil diperbarui."
                : "Membership baru berhasil ditambahkan."
        );


        await loadMemberships();

        updateDashboard();

    });


/* =========================================================
   23. EDIT MEMBERSHIP
========================================================= */

function editMembership(id) {

    openMembershipModal(id);

}


/* =========================================================
   24. DELETE MEMBERSHIP
========================================================= */

async function deleteMembership(id) {

    const item =
        membershipData.find(
            membership =>
                Number(
                    membership.id_membership
                ) === Number(id)
        );


    if (!item) {
        return;
    }


    const name =
        item.member?.nama_member || "member";


    const confirmed =
        confirm(
            `Hapus membership ${name} (${item.jenis_paket})?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("membership")
        .delete()
        .eq(
            "id_membership",
            id
        );


    if (error) {

        console.error(error);

        showToast(
            "Gagal",
            error.message,
            "error"
        );

        return;

    }


    showToast(
        "Berhasil",
        "Membership berhasil dihapus."
    );


    await loadAllData();

}


/* =========================================================
   25. PAYMENT MEMBERSHIP SELECT
========================================================= */

function populatePaymentMembershipSelect() {

    const select =
        document.getElementById(
            "paymentMembership"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Pilih membership
        </option>
    `;


    membershipData.forEach(item => {

        const name =
            item.member?.nama_member || "-";


        select.innerHTML += `
            <option value="${item.id_membership}">
                ${escapeHtml(name)}
                — ${escapeHtml(item.jenis_paket)}
                — ${formatRupiah(item.harga)}
            </option>
        `;

    });

}


/* =========================================================
   26. PAYMENT TABLE
========================================================= */

function renderPaymentTable() {

    const tbody =
        document.getElementById(
            "paymentTableBody"
        );


    if (!tbody) {
        return;
    }


    const search =
        (
            document.getElementById(
                "paymentSearch"
            )?.value || ""
        )
        .toLowerCase();


    const status =
        document.getElementById(
            "paymentStatusFilter"
        )?.value || "";


    const filtered =
        paymentData.filter(item => {

            const memberName =
                item.membership?.member?.nama_member
                || "";


            const period =
                item.periode_bayar || "";


            const matchesSearch =
                memberName
                    .toLowerCase()
                    .includes(search)
                ||
                period
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                !status ||
                item.status_pembayaran === status;


            return matchesSearch &&
                   matchesStatus;

        });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    Data pembayaran tidak ditemukan.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        filtered.map(payment => {

            const memberName =
                payment.membership?.member?.nama_member
                || "-";


            const packageName =
                payment.membership?.jenis_paket
                || "-";


            const badgeClass =
                payment.status_pembayaran === "Lunas"
                    ? "badge-paid"
                    : "badge-unpaid";


            return `
                <tr>

                    <td>
                        #${payment.id_pembayaran}
                    </td>

                    <td>
                        <div class="member-name">
                            ${escapeHtml(memberName)}
                        </div>
                    </td>

                    <td>
                        ${escapeHtml(packageName)}
                    </td>

                    <td>
                        ${formatDate(
                            payment.tanggal_pembayaran
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            payment.periode_bayar
                        )}
                    </td>

                    <td class="amount">
                        ${formatRupiah(
                            payment.jumlah_bayar
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            payment.metode_pembayaran
                        )}
                    </td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(
                                payment.status_pembayaran
                            )}
                        </span>
                    </td>

                    <td>

                        <div class="action-buttons">

                            <button
                                class="action-button edit"
                                title="Edit"
                                onclick="editPayment(${payment.id_pembayaran})"
                            >
                                ✎
                            </button>

                            <button
                                class="action-button delete"
                                title="Hapus"
                                onclick="deletePayment(${payment.id_pembayaran})"
                            >
                                ×
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   27. PAYMENT MODAL
========================================================= */

function openPaymentModal(id = null) {

    const form =
        document.getElementById(
            "paymentForm"
        );


    form.reset();


    document.getElementById(
        "paymentId"
    ).value = "";


    document.getElementById(
        "paymentDate"
    ).value = getToday();


    document.getElementById(
        "paymentMethod"
    ).value = "Tunai";


    document.getElementById(
        "paymentStatus"
    ).value = "Lunas";


    document.getElementById(
        "paymentModalTitle"
    ).textContent =
        "Tambah Pembayaran";


    if (id !== null) {

        const payment =
            paymentData.find(
                item =>
                    Number(
                        item.id_pembayaran
                    ) === Number(id)
            );


        if (!payment) {
            return;
        }


        document.getElementById(
            "paymentModalTitle"
        ).textContent =
            "Edit Pembayaran";


        document.getElementById(
            "paymentId"
        ).value =
            payment.id_pembayaran;


        document.getElementById(
            "paymentMembership"
        ).value =
            payment.id_membership;


        document.getElementById(
            "paymentDate"
        ).value =
            payment.tanggal_pembayaran;


        document.getElementById(
            "paymentPeriod"
        ).value =
            payment.periode_bayar;


        document.getElementById(
            "paymentAmount"
        ).value =
            payment.jumlah_bayar;


        document.getElementById(
            "paymentMethod"
        ).value =
            payment.metode_pembayaran;


        document.getElementById(
            "paymentStatus"
        ).value =
            payment.status_pembayaran;


        document.getElementById(
            "paymentNote"
        ).value =
            payment.keterangan || "";

    }


    document
        .getElementById("paymentModal")
        .classList.add("show");

}


function closePaymentModal() {

    document
        .getElementById("paymentModal")
        .classList.remove("show");

}


/* =========================================================
   28. SAVE PAYMENT
========================================================= */

document
    .getElementById("paymentForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const id =
            document.getElementById(
                "paymentId"
            ).value;


        const payload = {

            id_membership:
                Number(
                    document.getElementById(
                        "paymentMembership"
                    ).value
                ),

            tanggal_pembayaran:
                document.getElementById(
                    "paymentDate"
                ).value,

            periode_bayar:
                document.getElementById(
                    "paymentPeriod"
                ).value.trim(),

            jumlah_bayar:
                Number(
                    document.getElementById(
                        "paymentAmount"
                    ).value
                ),

            metode_pembayaran:
                document.getElementById(
                    "paymentMethod"
                ).value,

            status_pembayaran:
                document.getElementById(
                    "paymentStatus"
                ).value,

            keterangan:
                document.getElementById(
                    "paymentNote"
                ).value.trim()

        };


        let error;


        if (id) {

            const result =
                await supabaseClient
                    .from("pembayaran")
                    .update(payload)
                    .eq(
                        "id_pembayaran",
                        id
                    );

            error = result.error;

        } else {

            const result =
                await supabaseClient
                    .from("pembayaran")
                    .insert([payload]);

            error = result.error;

        }


        if (error) {

            console.error(error);

            showToast(
                "Gagal",
                error.message,
                "error"
            );

            return;

        }


        closePaymentModal();


        showToast(
            "Berhasil",
            id
                ? "Pembayaran berhasil diperbarui."
                : "Pembayaran baru berhasil ditambahkan."
        );


        await loadPayments();

        updateDashboard();

    });


/* =========================================================
   29. EDIT PAYMENT
========================================================= */

function editPayment(id) {

    openPaymentModal(id);

}


/* =========================================================
   30. DELETE PAYMENT
========================================================= */

async function deletePayment(id) {

    const payment =
        paymentData.find(
            item =>
                Number(
                    item.id_pembayaran
                ) === Number(id)
        );


    if (!payment) {
        return;
    }


    const confirmed =
        confirm(
            `Hapus pembayaran "${payment.periode_bayar}"?`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("pembayaran")
        .delete()
        .eq(
            "id_pembayaran",
            id
        );


    if (error) {

        console.error(error);

        showToast(
            "Gagal",
            error.message,
            "error"
        );

        return;

    }


    showToast(
        "Berhasil",
        "Pembayaran berhasil dihapus."
    );


    await loadAllData();

}


/* =========================================================
   31. CLOSE MODAL WHEN CLICK OUTSIDE
========================================================= */

document.querySelectorAll(".modal-overlay")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === modal
                ) {

                    modal.classList.remove(
                        "show"
                    );

                }

            }
        );

    });


/* =========================================================
   32. ESCAPE TO CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Escape") {
            return;
        }


        document
            .querySelectorAll(".modal-overlay")
            .forEach(modal => {

                modal.classList.remove(
                    "show"
                );

            });

    }
);


/* =========================================================
   33. INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        setupNavigation();


        document.getElementById(
            "todayDate"
        ).textContent =
            new Date().toLocaleDateString(
                "id-ID",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );


        await loadAllData();

    }
);