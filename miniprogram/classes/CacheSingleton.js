let instance = null;

class CacheSingleton {
    #db
    #userOpenId
    #needRegistration
    #studentName
    #studentGrade
    #studentClass
    #isAdmin
    #isPiDayAdmin
    constructor(db) {
        this.#db = db;
    }
    static initialize(db) {
        wx.showLoading({
          title: '加载中...',
          mask: true
        }); 
        if (instance === null) {
          instance = new CacheSingleton(db);
        }
        wx.hideLoading();
        return instance;
    }
    static getInstance() {
        wx.showLoading({
          title: '加载中...',
          mask: true
        });
        if (instance === null) {
          wx.hideLoading();
          throw new Error("CacheSingleton not initialized");
        }
        wx.hideLoading();
        return instance;
    }

    async fetchUserOpenId() {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      if (this.#userOpenId !== undefined) {
        wx.hideLoading();
        return this.#userOpenId;
      }
      let res = ((await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "getOpenId"
        }
      })).result).openid;
      this.#userOpenId = res;
      wx.hideLoading();
      return this.#userOpenId;
    }

    async determineNeedNewUser() {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      if (this.#needRegistration !== undefined) {
        console.log("Registration Status Already Fetched");
        wx.hideLoading();
        return this.#needRegistration;
      }
      let checkUser = await wx.cloud.database().collection("userData").where({
        userId: this.#userOpenId,
      }).get();
      if (checkUser.data.length === 0){
        console.log("User not registered...")
        wx.hideLoading();
        this.#needRegistration = true;
        return this.#needRegistration;
      }
      this.#studentName = checkUser.data[0].name;
      this.#studentGrade = checkUser.data[0].grade;
      this.#studentClass = checkUser.data[0].class;
      this.#needRegistration = false;
      let checkAdmin = await wx.cloud.database().collection("admins").where({
        adminId: checkUser.data[0]._id,
      }).get();
      if (checkAdmin.data.length === 1){
        this.#isAdmin = true;
      } else this.#isAdmin = false;
      let checkPiDayAdmin = await wx.cloud.database().collection("piDayAdmins").where({
        adminId: checkUser.data[0]._id,
      }).get();
      if (checkPiDayAdmin.data.length === 1){
        this.#isPiDayAdmin = true;
      } else this.#isPiDayAdmin = false;
      wx.hideLoading();
      return this.#needRegistration;
    }

    fetchUserInfo(option) {
      if (option === 'name') {
        return this.#studentName;
      } else if (option === 'grade') {
        return this.#studentGrade;
      } else if (option === 'class') {
        return this.#studentClass;
      } else if (option === 'isAdmin') {
        return this.#isAdmin;
      } else if (option === 'isPiDayAdmin') {
        return this.#isPiDayAdmin;
      } else return undefined;
    }
}

export default CacheSingleton;