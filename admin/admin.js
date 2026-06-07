// SUPABASE CONFIGURATION
const SUPABASE_URL =
    "https://unjlvlmlgupwknyfhnvi.supabase.co";
const SUPABASE_KEY =
    "sb_publishable_aS3dRdXJ9dsFkA-MK9vIIQ_Ngv1HFhs";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

// LOGIN SYSTEM

async function login() {

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        document.getElementById("loginStatus")
            .innerText = error.message;
        return;
    }

    // Verify user is an admin
    await checkAdmin();
}

// Logs the current user out
async function logout() {

    await supabaseClient.auth.signOut();

    document.getElementById("loginBox")
        .style.display = "block";

    document.getElementById("adminPanel")
        .style.display = "none";
}

// ADMIN ROLE CHECK

async function checkAdmin() {

    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("role")
            .single();

    if (error) {
        console.error(error);
        alert("Profile lookup failed");
        return;
    }

// Reject non-admin users
    if (profile.role !== "admin") {

        alert("Not authorized");

        await logout();

        return;
    }
    
// Hide login form
    document.getElementById("loginBox")
        .style.display = "none";

// Show admin area
    document.getElementById("adminPanel")
        .style.display = "block";
    
// Load moderation queue
    loadQueue();
}

// MODERATION QUEUE

// Container where pending submissions are displayed
const queue =
    document.getElementById("queue");

// Loads all unapproved markers
async function loadQueue() {

    queue.innerHTML = "";

    const { data, error } =
        await supabaseClient
            .from("markers")
            .select("*")
            .eq("approved", false);

    if (error) {
        console.error(error);
        return;
    }

// Create a card for each pending submission
    data.forEach(createSubmissionCard);
}

// CARD CREATION

function createSubmissionCard(item) {

    const card =
        document.createElement("div");

    card.className = "card";

    card.innerHTML = `
        <h3>${item.building_name}</h3>

        <p>
            <strong>Style:</strong>
            ${item.architectural_style}
        </p>

        <p>${item.description}</p>

        ${
            item.photo_url
                ? `<img src="${item.photo_url}">`
                : ""
        }

        <button onclick="approve(${item.id})">
            Approve
        </button>

        <button onclick="removeEntry(${item.id})">
            Delete
        </button>
    `;
    queue.appendChild(card);
}

// MODERATION ACTIONS

async function approve(id) {

    await supabaseClient
        .from("markers")
        .update({
            approved: true
        })
        .eq("id", id);

    loadQueue();
}

async function removeEntry(id) {

    await supabaseClient
        .from("markers")
        .delete()
        .eq("id", id);

    loadQueue();
}

// EXPOSE FUNCTIONS TO HTML BUTTONS

window.login = login;
window.logout = logout;
window.approve = approve;
window.removeEntry = removeEntry;
