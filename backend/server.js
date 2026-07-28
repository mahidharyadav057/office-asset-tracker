const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = './data.json';

// Initialize data.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ assets: [], employees: [], assignments: [] }, null, 2));
}

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

app.get('/assets', (req, res) => res.json(readData().assets));

app.post('/assets', (req, res) => {
    const data = readData();
    const asset = { id: Date.now(), name: req.body.name, category: req.body.category, status: 'Available' };
    data.assets.push(asset);
    writeData(data);
    res.json(asset);
});

app.get('/employees', (req, res) => res.json(readData().employees));

app.post('/employees', (req, res) => {
    const data = readData();
    const employee = { id: Date.now(), name: req.body.name, department: req.body.department };
    data.employees.push(employee);
    writeData(data);
    res.json(employee);
});

app.post('/assign', (req, res) => {
    const data = readData();
    const asset = data.assets.find(a => a.id == req.body.assetId);
    if (asset) asset.status = 'Assigned';
    data.assignments.push({ id: Date.now(), assetId: req.body.assetId, employeeId: req.body.employeeId, date: new Date().toLocaleDateString() });
    writeData(data);
    res.json({ message: 'Assigned!' });
});

app.post('/return', (req, res) => {
    const data = readData();
    const asset = data.assets.find(a => a.id == req.body.assetId);
    if (asset) asset.status = 'Available';
    data.assignments = data.assignments.filter(a => a.assetId != req.body.assetId);
    writeData(data);
    res.json({ message: 'Returned!' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));