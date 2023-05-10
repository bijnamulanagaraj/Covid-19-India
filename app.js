const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieNamePascalCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictsPascalCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1
app.get("/states/", async (request, response) => {
  const getAllStates = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await db.all(getAllStates);
  response.send(
    statesArray.map((stateObject) => convertMovieNamePascalCase(stateObject))
  );
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieDetails = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const state = await db.get(getMovieDetails);
  response.send(convertMovieNamePascalCase(state));
});

// API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictDetails = `
     INSERT INTO
       district (district_name, state_id, cases, cured, active, deaths)
     VALUES(
       '${districtName}',
       ${stateId},
       ${cases},
       ${cured},
       ${active},
       ${deaths});`;

  await db.run(addDistrictDetails);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getDistrictDetails);
  response.send(convertDistrictsPascalCase(district));
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetails = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`;
  await db.get(deleteDistrictDetails);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictDetails = `
     UPDATE
       district
     SET
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
     WHERE
       district_id = ${districtId};`;

  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

// API 7
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT
      state_name AS stateName
    FROM
      district INNER JOIN state ON district.state_id = state.state_id
    WHERE
      district_id = ${districtId};`;
  const stateName = await db.get(getDistrictDetails);
  response.send(stateName);
});

// API 8
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictDetails = `
    SELECT
      SUM(cases) as totalCases,
      SUM(cured) as totalCured,
      SUM(active) as totalActive,
      SUM(deaths) as totalDeaths
    FROM
      district
    WHERE
      state_id = ${stateId};`;
  const district = await db.get(getDistrictDetails);
  response.send(district);
});
module.exports = app;
