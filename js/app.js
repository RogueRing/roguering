const SUPABASE_URL =
    "https://unjlvlmlgupwknyfhnvi.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_aS3dRdXJ9dsFkA-MK9vIIQ_Ngv1HFhs";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const map = L.map("map").setView(
    [54.5, -3.5],
    6
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:"© OpenStreetMap"
    }
).addTo(map);

let selectedLat = null;
let selectedLng = null;
let tempMarker = null;

const form =
    document.getElementById("markerForm");

map.on("click", (e)=>{

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    form.classList.remove("hidden");

    if(tempMarker){
        map.removeLayer(tempMarker);
    }

    tempMarker =
        L.marker([selectedLat, selectedLng])
        .addTo(map);
});

loadApprovedMarkers();

async function loadApprovedMarkers(){

    const { data, error } =
        await supabaseClient
        .from("markers")
        .select("*")
        .eq("approved", true);

    if(error){
        console.error(error);
        return;
    }

    data.forEach(row=>{

        L.marker([
            row.latitude,
            row.longitude
        ])
        .addTo(map)
        .bindPopup(`
            <strong>${row.building_name}</strong><br>
            ${row.architectural_style}<br><br>
            ${row.description}<br><br>
            <img
                src="${row.photo_url}"
                width="200"
            >
        `);
    });
}

form.addEventListener(
    "submit",
    async (e)=>{

        e.preventDefault();

        const file =
            document.getElementById("photo")
            .files[0];

        let photoUrl = null;

        if(file){

            const filename =
                Date.now() +
                "_" +
                file.name;

            const upload =
                await supabaseClient
                .storage
                .from("architecture-photos")
                .upload(
                    filename,
                    file
                );

            if(upload.error){
                alert(upload.error.message);
                return;
            }

            const publicData =
                supabaseClient
                .storage
                .from("architecture-photos")
                .getPublicUrl(filename);

            photoUrl =
                publicData.data.publicUrl;
        }

        const payload = {

            building_name:
                document.getElementById(
                    "building_name"
                ).value,

            architectural_style:
                document.getElementById(
                    "architectural_style"
                ).value,

            description:
                document.getElementById(
                    "description"
                ).value,

            photo_url: photoUrl,

            latitude: selectedLat,

            longitude: selectedLng,

            approved: false
        };

        const result =
            await supabaseClient
            .from("markers")
            .insert(payload);

        if(result.error){
            alert(result.error.message);
            return;
        }

        alert(
            "Submission sent for moderation."
        );

        form.reset();
    }
);
