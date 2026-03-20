
const KEY_MAPPING = {
    'nombrecliente': 'nombreCliente',
    'rutcliente': 'rutCliente',
    'startdate': 'startDate',
    'enddate': 'endDate',
    'clientname': 'clientName',
    'teamnames': 'teamNames',
    'createdat': 'createdAt',
    'updatedat': 'updatedAt'
};

function fromDbPayload(data) {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => fromDbPayload(item));
    
    const result = { ...data };
    Object.keys(data).forEach(key => {
        const mappedKey = KEY_MAPPING[key.toLowerCase()];
        if (mappedKey && mappedKey !== key) {
            result[mappedKey] = data[key];
        }
    });
    return result;
}

const testData = {
    id: "uuid-123",
    name: "Proyecto Test",
    clientname: "ICSA Chile",
    startdate: "2026-03-20T10:00:00Z",
    teamnames: ["Juan Perez", "Maria Sanchez"],
    status: "Active"
};

const result = fromDbPayload(testData);
console.log("Original:", testData);
console.log("Transformed:", result);

if (result.clientName === "ICSA Chile" && result.teamNames.length === 2 && result.startDate) {
    console.log("SUCCESS: Client and Team mappings verified.");
} else {
    console.log("FAILURE: Mappings not working as expected.");
}
