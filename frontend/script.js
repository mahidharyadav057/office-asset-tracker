async function addAsset() {
    const name = document.getElementById('assetName').value;
    await fetch('http://localhost:3000/assets', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, category: 'General' })
    });
    location.reload();
}