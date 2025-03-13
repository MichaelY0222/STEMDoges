const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const currentUserId = wxContext.OPENID;
  try {
    const users = await fetchAllData("userData");
    const logs = await fetchAllData("piDayActivityLog");

    let leaderboard = [];
    let currentUserPoints = 0;
    let currentUserRank = 0;
    let rankCurrentUser = false;

    users.forEach(user => {
      let userId = user.userId;
      let userLogs = logs.filter(log => log.userId === userId);

      if (userLogs.length === 0) return;

      let totalPoints = 0;

      userLogs.forEach(log => {
        if (log.type === "Trivia" && log.status === "correct") {
          totalPoints += 3;
        } else if (log.type === "Scav" && log.status === "correct") {
          totalPoints += 5;
        } else if (log.points) {
          totalPoints += log.points;
        }
      });

      if (totalPoints > 0) {
        leaderboard.push({
          userId: user.userId,
          name: user.name,
          grade: user.grade,
          class: user.class,
          points: totalPoints
        });
        if (user.userId === currentUserId) {
          currentUserPoints = totalPoints;
          rankCurrentUser = true;
        }
      }
    });

    leaderboard.sort((a, b) => b.points - a.points);
    if (rankCurrentUser){
      currentUserRank = leaderboard.findIndex(user => user.userId === currentUserId) + 1;
    }

    return { 
      leaderboard,
      currentUserRank,
      currentUserPoints
    };
  } catch (error) {
    console.error("Leaderboard error:", error);
    return { error: error.message };
  }
};

async function fetchAllData(collectionName) {
  let allData = [];
  let batchSize = 20;
  let totalFetched = 0;
  
  while (true) {
    const res = await db.collection(collectionName)
      .skip(totalFetched)
      .limit(batchSize)
      .get();
    
    allData = allData.concat(res.data);
    totalFetched += res.data.length;

    if (res.data.length < batchSize) {
      break;
    }
  }

  return allData;
}