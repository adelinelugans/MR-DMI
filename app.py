from flask import Flask,request,jsonify,send_from_directory
import sqlite3,urllib.request,urllib.parse,json,datetime
A=Flask(__name__,static_folder="web")
def con():
 c=sqlite3.connect("mrdmi.db");c.row_factory=sqlite3.Row;c.execute("CREATE TABLE IF NOT EXISTS devices(di TEXT PRIMARY KEY, company TEXT, brand TEXT, model TEXT, mri TEXT, source TEXT, raw TEXT)");c.commit();return c
def get(u):
 with urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"MR-DMI/1"}),timeout=12) as r:return json.loads(r.read())
@A.get("/api/device")
def dev():
 q=request.args.get("q","").strip(); c=con(); r=c.execute("SELECT * FROM devices WHERE di=?",(q,)).fetchone()
 if r:return jsonify(ok=True,cached=True,device=dict(r))
 try:
  z=get("https://accessgudid.nlm.nih.gov/api/v3/devices/lookup.json?di="+urllib.parse.quote(q));d=z["gudid"]["device"]; ids=d.get("identifiers",{}).get("identifier",[]);ids=[ids] if isinstance(ids,dict) else ids
  di=next((x.get("deviceId") for x in ids if x.get("deviceIdType")=="Primary"),q)
  x={"di":di,"company":d.get("companyName"),"brand":d.get("brandName"),"model":d.get("versionModelNumber"),"mri":d.get("mriSafety"),"source":"AccessGUDID"}
 except:
  try:
   z=get("https://api.fda.gov/device/udi.json?search=identifiers.id:"+urllib.parse.quote(q)+"&limit=1")["results"][0]; ids=z.get("identifiers",[]);di=ids[0].get("id",q) if ids else q
   x={"di":di,"company":z.get("company_name"),"brand":z.get("brand_name"),"model":z.get("version_or_model_number"),"mri":z.get("mri_safety"),"source":"openFDA/GUDID"}
  except:return jsonify(ok=False,error="DMI non retrouvé automatiquement"),404
 c.execute("INSERT OR REPLACE INTO devices VALUES(?,?,?,?,?,?,?)",(x["di"],x["company"],x["brand"],x["model"],x["mri"],x["source"],json.dumps(x)));c.commit()
 return jsonify(ok=True,cached=False,device=x)
@A.get("/api/library")
def lib():return jsonify(devices=[dict(x) for x in con().execute("SELECT di,company,brand,model,mri,source FROM devices").fetchall()])
@A.get("/")
def home():return jsonify(status="prototype", service="MR-DMI", endpoints=["/api/device?q=UDI", "/api/library"])
if __name__=="__main__":con();A.run(host="0.0.0.0",port=8080)

