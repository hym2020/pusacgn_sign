var discuzSim = require("../core/discuzSim.js");

class pusacgnSim extends discuzSim {
	constructor(siteURL){
		super("pusacgn", siteURL, false);
	}
	
	async dailySign(){
		
		try{
			let r = await super.dailySign(`${this.hostURL}/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&sign_as=1&inajax=1`, undefined , {
					qdmode: "1",
					todaysay: "大家好，又是美好的一天，願上帝保佑你",
					fastreply: "0",
					qdxq: "kx"
				}, `${this.hostURL}`);
			if(/簽到成功|已經簽到/.test(r.message)){
				r.message = "已簽";
			}
			
			return Promise.resolve(r);
		}
		catch(e){
			console.log(e);
			return Promise.resolve({
				status: "failed",
				message: "Error in dailySign"
			});
		}	
	}
	
	async signPostProcess(){
		if(!this.isLogin)
			return Promise.resolve({
				status: "failed",
				message: "Not logged in"
			});
		
		try{
			let $ = this.siteUtils.constructor.cheerioLoad((await this.siteUtils.sendGetRequest(this.hostURL)).body);
			let formhash = $("input[name='formhash']").attr("value");
			
			let r = await this.siteUtils.sendGetRequest(`${this.hostURL}/plugin.php?id=fx_checkin:checkin&formhash=${formhash}&${formhash}`);
			
			$ = this.siteUtils.constructor.cheerioLoad(r.body);
			return Promise.resolve({
				status: "success",
				message: $("#messagetext p").text()
			});
		}
		catch(e){
			console.log(e);
			return Promise.resolve({
				status: "failed",
				message: "Error in signPostProcess"
			});
		}		
	}
	
	async doGreet(){
		if(!this.isLogin)
			return Promise.resolve({
				status: "failed",
				message: "Not logged in"
			});
		try{
			const hostURL = this.hostURL;
			let	friendPage = await this.siteUtils.sendGetRequest(`${hostURL}/home.php?mod=space&do=friend`);
			let $ = this.siteUtils.constructor.cheerioLoad(friendPage.body);
			
			const formhash = $("input[name='formhash']").attr("value");
			
			var friendsID = $(".buddy li").toArray().map(e => $(e).attr("id").split("_").find(e1 => /[0-9]+/.test(e1)));
			var sample = number => {
				var arr = [];
				while(true){
					if(arr.length >= number) return arr;
					let pick = friendsID[Math.floor(Math.random()*friendsID.length)];
					if(arr.indexOf(pick) == -1) arr.push(pick);
				}
			};
			
			let pokeFriendPromise = sample(10).map(e => this.siteUtils.sendPostRequest(`${hostURL}/home.php?mod=spacecp&ac=poke&op=send&uid=${e}&inajax=1`, {
				referer: `${hostURL}/home.php?mod=space&do=friend`,
				pokesubmit: "true",
				formhash: formhash,
				from: "",
				handlekey: `a_poke_${e}`,
				iconid: "3",
				note: ""	
			}));
			
			pokeFriendPromise = await Promise.all(pokeFriendPromise);
			pokeFriendPromise = pokeFriendPromise.map(e => /已發送/.test(e.body) ? "已發送" : "未發送");
			
			return Promise.resolve(pokeFriendPromise);
		}
		catch(e){
			console.log(e);
			return Promise.resolve({
				status: "failed",
				message: "Error in signPostProcess"
			});
		}	
	}
};

module.exports = pusacgnSim;