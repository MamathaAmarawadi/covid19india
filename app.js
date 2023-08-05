const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//get method
const convertState = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/states/", async (request, response) => {
  const stateQuery = `
    select * from state;`;
  const stateDetails = await db.all(stateQuery);
  response.send(stateDetails.map((obj) => convertState(obj)));
});

//get stateid

const convertsToGetState = (getstateDetails) => {
  return {
    stateId: getstateDetails.state_id,
    stateName: getstateDetails.state_name,
    population: getstateDetails.population,
  };
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuery = `
    select * from state
    where state_id='${stateId}';`;
  const getstateDetails = await db.get(getstateQuery);
  //const { state_id, state_name, population } = getstateDetails;
  //const ob = {
  // stateId: state_id,
  // stateName: state_name,
  // population: population,
  // };
  // response.send(getstateDetails.map((obj) => convertState(obj)));
  response.send(convertsToGetState(getstateDetails));
});

//post district

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createQuery = `
  insert into district(district_name,
    state_id,cases,cured,active,deaths)
    values('${districtName}',
        '${stateId}',
        '${cases}',
       '${cured}',
        '${active}',
        '${deaths}');`;
  const createData = await db.run(createQuery);
  response.send("District Successfully Added");
});

//get district Details

const convertsToGetDistrict = (gd) => {
  return {
    districtId: gd.district_id,
    districtName: gd.district_name,
    stateId: gd.state_id,
    cases: gd.cases,
    cured: gd.cured,
    active: gd.active,
    deaths: gd.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictQuery = `
    select * from district
    where district_id='${districtId}';`;
  const getdistrictDetails = await db.get(getdistrictQuery);
  //const { state_id, state_name, population } = getstateDetails;
  //const ob = {
  // stateId: state_id,
  // stateName: state_name,
  // population: population,
  // };
  // response.send(getstateDetails.map((obj) => convertState(obj)));
  response.send(convertsToGetDistrict(getdistrictDetails));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
 delete from district
 where district_id='${districtId}';`;
  const deletedData = await db.run(deleteQuery);
  response.send("District Removed");
});
//put method
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updatedQuery = `
update district set
district_name='${districtName}',
state_id='${stateId}',
cases='${cases}',
cured='${cured}',
active='${active}',
deaths='${deaths}'
where district_id='${districtId}';`;

  const a = await db.run(updatedQuery);
  response.send("District Details Updated");
});
//get total details of states
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
SELECT 
SUM(cases),
SUM(cured),
SUM(active),
SUM(deaths)
FROM district
WHERE state_id=${stateId};`;

  const stats = await db.get(getStateStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//district related details fet method
//const convert=(pp)=>{
//return{
//   "stateName":pp.state_name;
// };
//};
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateId = `
  select
  state_id from district
  where district_id='${districtId}';`;
  const stateIdOp = await db.get(getStateId);
  const findName = `select
state_name as stateName from state
where state_id=${stateIdOp.state_id};`;
  const details = await db.get(findName);
  response.send(details);
});

module.exports = app;
