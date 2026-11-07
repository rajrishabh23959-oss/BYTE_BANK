import hashlib, json
from datetime import datetime, timezone, timedelta
from decimal import Decimal

PASSWORD_HASH = "$2b$10$FaFhzO7OE7tLdsZ1iaE.Cea13jOrNWjrJQmVUtF/Cix/jurn7lC.q" # password123

RAW_CUSTOMERS = [
  ("CUST101", "BB-ACC-5001", "Rishi Sharma", "9876543201", "rishi.sharma101@email.com", "12 MG Road, Bengaluru", "1999-04-15", "AADH-8821-9001", "verified", "active"),
  ("CUST102", "BB-ACC-5002", "Rahul Verma", "9876543202", "rahul.verma102@email.com", "45 Anna Salai, Chennai", "2000-08-22", "PAN-ABCPV1202F", "verified", "active"),
  ("CUST103", "BB-ACC-5003", "Priya Nair", "9876543203", "priya.nair103@email.com", "8B Marine Drive, Kochi", "1998-12-05", "AADH-4451-3303", "verified", "active"),
  ("CUST104", "BB-ACC-5004", "Aman Gupta", "9876543204", "aman.gupta104@email.com", "21 Park Street, Kolkata", "2001-01-30", "PAN-XYZPG9804K", "pending", "frozen"),
  ("CUST105", "BB-ACC-5005", "Sneha Reddy", "9876543205", "sneha.reddy105@email.com", "9 Jubilee Hills, Hyderabad", "1997-07-19", "AADH-9910-1105", "verified", "active"),
  ("CUST106", "BB-ACC-5006", "Vikramaditya Rao", "9876543206", "vikram.rao106@email.com", "34 Lawspet Main Rd, Puducherry", "2000-11-11", "AADH-7712-6606", "verified", "active"),
  ("CUST107", "BB-ACC-5007", "Ananya Iyer", "9876543207", "ananya.iyer107@email.com", "19 Adyar Cross, Chennai", "1996-03-14", "PAN-IYERA1107M", "verified", "active"),
  ("CUST108", "BB-ACC-5008", "Rohan Deshmukh", "9876543208", "rohan.deshmukh108@email.com", "56 FC Road, Pune", "1995-09-28", "AADH-3310-4408", "verified", "active"),
  ("CUST109", "BB-ACC-5009", "Kavita Joshi", "9876543209", "kavita.joshi109@email.com", "78 CG Road, Ahmedabad", "1999-06-12", "PAN-JOSHK2209P", "verified", "active"),
  ("CUST110", "BB-ACC-5010", "Siddharth Malhotra", "9876543210", "siddharth.m110@email.com", "14 Connaught Place, New Delhi", "1994-12-03", "AADH-5501-8810", "verified", "active"),
  ("CUST111", "BB-ACC-5011", "Meera Krishnan", "9876543211", "meera.krishnan111@email.com", "23 Kalapet Beach Rd, Puducherry", "2001-05-18", "AADH-6612-9911", "verified", "active"),

  ("CUST112", "BB-ACC-5012", "Arjun Kapoor", "9876543212", "arjun.kapoor112@email.com", "102 Bandra West, Mumbai", "1993-08-07", "PAN-KAPOA3312Q", "verified", "active"),
  ("CUST113", "BB-ACC-5013", "Divya Menon", "9876543213", "divya.menon113@email.com", "41 Edappally, Kochi", "1998-02-25", "AADH-7123-4513", "verified", "active"),
  ("CUST114", "BB-ACC-5014", "Nikhil Chatterjee", "9876543214", "nikhil.c114@email.com", "88 Salt Lake Sec 5, Kolkata", "1997-10-16", "PAN-CHATN4414R", "pending", "active"),
  ("CUST115", "BB-ACC-5015", "Pooja Hegde", "9876543215", "pooja.hegde115@email.com", "15 Indiranagar, Bengaluru", "2000-01-09", "AADH-8234-5615", "verified", "active"),
  ("CUST116", "BB-ACC-5016", "Karan Mehra", "9876543216", "karan.mehra116@email.com", "63 Civil Lines, Jaipur", "1996-07-21", "PAN-MEHRK5516S", "verified", "active"),
  ("CUST117", "BB-ACC-5017", "Neha Agarwal", "9876543217", "neha.agarwal117@email.com", "29 Hazratganj, Lucknow", "1999-11-30", "AADH-9345-6717", "verified", "active"),
  ("CUST118", "BB-ACC-5018", "Varun Dhawan", "9876543218", "varun.dhawan118@email.com", "74 Juhu Tara Rd, Mumbai", "1995-04-04", "PAN-DHAWV6618T", "verified", "active"),
  ("CUST119", "BB-ACC-5019", "Shruti Haasan", "9876543219", "shruti.haasan119@email.com", "11 T Nagar, Chennai", "1998-09-13", "AADH-1456-7819", "verified", "active"),
  ("CUST120", "BB-ACC-5020", "Aditya Roy", "9876543220", "aditya.roy120@email.com", "37 Ballygunge, Kolkata", "1994-05-22", "PAN-ROYAD7720U", "verified", "active"),
  ("CUST121", "BB-ACC-5021", "Tanvi Kulkarni", "9876543221", "tanvi.kulkarni121@email.com", "91 Kothrud, Pune", "2001-12-17", "AADH-2567-8921", "verified", "active"),
  ("CUST122", "BB-ACC-5022", "Manish Tiwari", "9876543222", "manish.tiwari122@email.com", "52 Gomti Nagar, Lucknow", "1997-03-08", "PAN-TIWAM8822V", "verified", "frozen"),
  ("CUST123", "BB-ACC-5023", "Swati Mishra", "9876543223", "swati.mishra123@email.com", "18 Boring Road, Patna", "2000-06-29", "AADH-3678-9023", "verified", "active"),
  ("CUST124", "BB-ACC-5024", "Deepak Chahar", "9876543224", "deepak.chahar124@email.com", "44 Malviya Nagar, Jaipur", "1996-10-01", "PAN-CHAHD9924W", "verified", "active"),

  ("CUST125", "BB-ACC-5025", "Ritu Choudhary", "9876543225", "ritu.choudhary125@email.com", "67 Sector 17, Chandigarh", "1999-02-14", "AADH-4789-0125", "verified", "active"),
  ("CUST126", "BB-ACC-5026", "Gaurav Saxena", "9876543226", "gaurav.saxena126@email.com", "83 Arera Colony, Bhopal", "1995-08-19", "PAN-SAXEG1026X", "verified", "active"),
  ("CUST127", "BB-ACC-5027", "Ishita Banerjee", "9876543227", "ishita.banerjee127@email.com", "16 New Town, Kolkata", "2002-01-25", "AADH-5890-1227", "verified", "active"),
  ("CUST128", "BB-ACC-5028", "Harshvardhan Rane", "9876543228", "harsh.rane128@email.com", "31 Banjara Hills, Hyderabad", "1993-11-05", "PAN-RANEH2128Y", "verified", "active"),
  ("CUST129", "BB-ACC-5029", "Kriti Sanon", "9876543229", "kriti.sanon129@email.com", "49 Hauz Khas, New Delhi", "1998-07-27", "AADH-6901-2329", "verified", "active"),
  ("CUST130", "BB-ACC-5030", "Yashwanth Gowda", "9876543230", "yash.gowda130@email.com", "72 Jayanagar, Bengaluru", "1997-04-11", "PAN-GOWDY3230Z", "verified", "active"),
  ("CUST131", "BB-ACC-5031", "Bhavana Pillai", "9876543231", "bhavana.pillai131@email.com", "25 Kowdiar, Trivandrum", "2000-09-02", "AADH-7012-3431", "verified", "active"),
  ("CUST132", "BB-ACC-5032", "Saurabh Shukla", "9876543232", "saurabh.shukla132@email.com", "60 Swaroop Nagar, Kanpur", "1994-12-18", "PAN-SHUKS4332A", "pending", "active"),
  ("CUST133", "BB-ACC-5033", "Nandini Sengupta", "9876543233", "nandini.s133@email.com", "13 Howrah Maidan, Kolkata", "1999-05-06", "AADH-8123-4533", "verified", "active"),
  ("CUST134", "BB-ACC-5034", "Prashanth Neel", "9876543234", "prashanth.n134@email.com", "87 Malleshwaram, Bengaluru", "1996-01-20", "PAN-NEELP5434B", "verified", "active"),
  ("CUST135", "BB-ACC-5035", "Aishwarya Rajesh", "9876543235", "aishwarya.r135@email.com", "42 Besant Nagar, Chennai", "2001-03-15", "AADH-9234-5635", "verified", "active"),
  ("CUST136", "BB-ACC-5036", "Mayank Agarwal", "9876543236", "mayank.a136@email.com", "95 Whitefield, Bengaluru", "1995-06-08", "PAN-AGARM6536C", "verified", "active"),
  ("CUST137", "BB-ACC-5037", "Pallavi Joshi", "9876543237", "pallavi.joshi137@email.com", "28 Shivaji Park, Mumbai", "1998-10-23", "AADH-1345-6737", "verified", "active"),

  ("CUST138", "BB-ACC-5038", "Rajat Patidar", "9876543238", "rajat.patidar138@email.com", "54 Vijay Nagar, Indore", "1997-08-14", "PAN-PATIR7638D", "verified", "active"),
  ("CUST139", "BB-ACC-5039", "Smriti Mandhana", "9876543239", "smriti.m139@email.com", "76 Koregaon Park, Pune", "1999-07-18", "AADH-2456-7839", "verified", "active"),
  ("CUST140", "BB-ACC-5040", "Abhishek Bachchan", "9876543240", "abhishek.b140@email.com", "108 Worli Sea Face, Mumbai", "1993-02-05", "PAN-BACHA8740E", "verified", "active"),
  ("CUST141", "BB-ACC-5041", "Keerthy Suresh", "9876543241", "keerthy.s141@email.com", "33 Anna Nagar, Chennai", "2000-10-17", "AADH-3567-8941", "verified", "active"),
  ("CUST142", "BB-ACC-5042", "Tushar Deshpande", "9876543242", "tushar.d142@email.com", "61 Thane West, Mumbai", "1996-05-15", "PAN-DESHT9842F", "verified", "active"),
  ("CUST143", "BB-ACC-5043", "Sonali Bendre", "9876543243", "sonali.b143@email.com", "19 Vashi Sec 17, Navi Mumbai", "1995-01-01", "AADH-4678-9043", "verified", "active"),
  ("CUST144", "BB-ACC-5044", "Naveen Patnaik", "9876543244", "naveen.p144@email.com", "47 Saheed Nagar, Bhubaneswar", "1994-09-16", "PAN-PATNN0944G", "pending", "active"),
  ("CUST145", "BB-ACC-5045", "Radhika Apte", "9876543245", "radhika.apte145@email.com", "82 Aundh, Pune", "1998-09-07", "AADH-5789-0145", "verified", "active"),
  ("CUST146", "BB-ACC-5046", "Dulquer Salmaan", "9876543246", "dulquer.s146@email.com", "14 Panampilly Nagar, Kochi", "1996-07-28", "PAN-SALMD1046H", "verified", "active"),
  ("CUST147", "BB-ACC-5047", "Sai Pallavi", "9876543247", "sai.pallavi147@email.com", "59 RS Puram, Coimbatore", "2001-05-09", "AADH-6890-1247", "verified", "active"),
  ("CUST148", "BB-ACC-5048", "Vidyut Jammwal", "9876543248", "vidyut.j148@email.com", "22 Gandhi Nagar, Jammu", "1993-12-10", "PAN-JAMMV2148J", "verified", "active"),
  ("CUST149", "BB-ACC-5049", "Mrunal Thakur", "9876543249", "mrunal.t149@email.com", "71 Andheri West, Mumbai", "1999-08-01", "AADH-7901-2349", "verified", "active"),
  ("CUST150", "BB-ACC-5050", "Karthik Subbaraj", "9876543250", "karthik.s150@email.com", "38 KK Nagar, Madurai", "1995-03-20", "PAN-SUBBK3250K", "verified", "active"),

  ("CUST151", "BB-ACC-5051", "Nithya Menen", "9876543251", "nithya.m151@email.com", "64 Banashankari, Bengaluru", "1998-04-08", "AADH-8012-3451", "verified", "active"),
  ("CUST152", "BB-ACC-5052", "Surya Sivakumar", "9876543252", "surya.s152@email.com", "17 Mylapore, Chennai", "1994-07-23", "PAN-SIVAS4352L", "verified", "active"),
  ("CUST153", "BB-ACC-5053", "Trisha Krishnan", "9876543253", "trisha.k153@email.com", "93 Alwarpet, Chennai", "1997-05-04", "AADH-9123-4553", "verified", "active"),
  ("CUST154", "BB-ACC-5054", "Vijay Deverakonda", "9876543254", "vijay.d154@email.com", "46 Film Nagar, Hyderabad", "1996-05-09", "PAN-DEVEV5454M", "verified", "active"),
  ("CUST155", "BB-ACC-5055", "Rashmika Mandanna", "9876543255", "rashmika.m155@email.com", "27 Koramangala, Bengaluru", "2000-04-05", "AADH-1234-5655", "verified", "active"),
  ("CUST156", "BB-ACC-5056", "Allu Arjun", "9876543256", "allu.arjun156@email.com", "81 Madhapur, Hyderabad", "1995-04-08", "PAN-ARJUA6556N", "verified", "active"),
  ("CUST157", "BB-ACC-5057", "Samantha Ruth", "9876543257", "samantha.r157@email.com", "53 Pallavaram, Chennai", "1998-04-28", "AADH-2345-6757", "verified", "active"),
  ("CUST158", "BB-ACC-5058", "Ram Charan", "9876543258", "ram.charan158@email.com", "39 Gachibowli, Hyderabad", "1994-03-27", "PAN-CHARR7658P", "verified", "frozen"),
  ("CUST159", "BB-ACC-5059", "Kajal Aggarwal", "9876543259", "kajal.a159@email.com", "68 Colaba Causeway, Mumbai", "1997-06-19", "AADH-3456-7859", "verified", "active"),
  ("CUST160", "BB-ACC-5060", "Nani Ghanta", "9876543260", "nani.g160@email.com", "15 Begumpet, Hyderabad", "1996-02-24", "PAN-GHANN8760Q", "verified", "active"),
  ("CUST161", "BB-ACC-5061", "Anushka Shetty", "9876543261", "anushka.s161@email.com", "84 Kadri Hills, Mangaluru", "1995-11-07", "AADH-4567-8961", "verified", "active"),
  ("CUST162", "BB-ACC-5062", "Prabhas Raju", "9876543262", "prabhas.r162@email.com", "29 Kukatpally, Hyderabad", "1993-10-23", "PAN-RAJUP9862R", "verified", "active"),
  ("CUST163", "BB-ACC-5063", "Tamannaah Bhatia", "9876543263", "tamannaah.b163@email.com", "73 Lokhandwala, Mumbai", "1999-12-21", "AADH-5678-9063", "verified", "active"),

  ("CUST164", "BB-ACC-5064", "Rana Daggubati", "9876543264", "rana.d164@email.com", "41 Somajiguda, Hyderabad", "1994-12-14", "PAN-DAGGR0964S", "verified", "active"),
  ("CUST165", "BB-ACC-5065", "Rakul Preet", "9876543265", "rakul.p165@email.com", "96 Defence Colony, New Delhi", "2000-10-10", "AADH-6789-0165", "verified", "active"),
  ("CUST166", "BB-ACC-5066", "Mahesh Babu", "9876543266", "mahesh.b166@email.com", "58 Secunderabad, Hyderabad", "1993-08-09", "PAN-BABUM1066T", "verified", "active"),
  ("CUST167", "BB-ACC-5067", "Kiara Advani", "9876543267", "kiara.a167@email.com", "24 Mahalaxmi, Mumbai", "2001-07-31", "AADH-7890-1267", "verified", "active"),
  ("CUST168", "BB-ACC-5068", "Shahid Kapoor", "9876543268", "shahid.k168@email.com", "62 Versova, Mumbai", "1995-02-25", "PAN-KAPOS2168U", "pending", "active"),
  ("CUST169", "BB-ACC-5069", "Taapsee Pannu", "9876543269", "taapsee.p169@email.com", "35 Rajouri Garden, New Delhi", "1997-08-01", "AADH-8901-2369", "verified", "active"),
  ("CUST170", "BB-ACC-5070", "Ayushmann Khurrana", "9876543270", "ayushmann.k170@email.com", "89 Sector 9, Chandigarh", "1994-09-14", "PAN-KHURA3270V", "verified", "active"),
  ("CUST171", "BB-ACC-5071", "Bhumi Pednekar", "9876543271", "bhumi.p171@email.com", "48 Mulund West, Mumbai", "1998-07-18", "AADH-9012-3471", "verified", "active"),
  ("CUST172", "BB-ACC-5072", "Rajkummar Rao", "9876543272", "rajkummar.r172@email.com", "77 DLF Phase 3, Gurugram", "1995-08-31", "PAN-RAORJ4372W", "verified", "active"),
  ("CUST173", "BB-ACC-5073", "Yami Gautam", "9876543273", "yami.g173@email.com", "19 Sector 34, Chandigarh", "1999-11-28", "AADH-0123-4573", "verified", "active"),
  ("CUST174", "BB-ACC-5074", "Vicky Kaushal", "9876543274", "vicky.k174@email.com", "51 Malad West, Mumbai", "1996-05-16", "PAN-KAUSV5474X", "verified", "active"),
  ("CUST175", "BB-ACC-5075", "Sanya Malhotra", "9876543275", "sanya.m175@email.com", "83 Punjabi Bagh, New Delhi", "2000-02-25", "AADH-1234-6775", "verified", "active"),
  ("CUST176", "BB-ACC-5076", "Kartik Aaryan", "9876543276", "kartik.a176@email.com", "32 City Center, Gwalior", "1997-11-22", "PAN-AARYK6576Y", "verified", "active"),

  ("CUST177", "BB-ACC-5077", "Sara Ali Khan", "9876543277", "sara.k177@email.com", "66 Pali Hill, Mumbai", "2001-08-12", "AADH-2345-7877", "verified", "active"),
  ("CUST178", "BB-ACC-5078", "Ishan Kishan", "9876543278", "ishan.k178@email.com", "43 Kankarbagh, Patna", "2000-07-18", "PAN-KISHI7678Z", "verified", "active"),
  ("CUST179", "BB-ACC-5079", "Janhvi Kapoor", "9876543279", "janhvi.k179@email.com", "90 Green Park, New Delhi", "2002-03-06", "AADH-3456-8979", "verified", "active"),
  ("CUST180", "BB-ACC-5080", "Shubman Gill", "9876543280", "shubman.g180@email.com", "21 Phase 7, Mohali", "2001-09-08", "PAN-GILLS8780A", "verified", "active"),
  ("CUST181", "BB-ACC-5081", "Ananya Panday", "9876543281", "ananya.p181@email.com", "57 Khar West, Mumbai", "2002-10-30", "AADH-4567-9081", "pending", "active"),
  ("CUST182", "BB-ACC-5082", "Rishabh Pant", "9876543282", "rishabh.p182@email.com", "78 Civil Lines, Roorkee", "1999-10-04", "PAN-PANTR9882B", "verified", "active"),
  ("CUST183", "BB-ACC-5083", "Tara Sutaria", "9876543283", "tara.s183@email.com", "34 Dadar East, Mumbai", "2000-11-19", "AADH-5678-0183", "verified", "active"),
  ("CUST184", "BB-ACC-5084", "Shreyas Iyer", "9876543284", "shreyas.i184@email.com", "69 Worli Naka, Mumbai", "1996-12-06", "PAN-IYERS0984C", "verified", "active"),
  ("CUST185", "BB-ACC-5085", "Alaya Furniturewala", "9876543285", "alaya.f185@email.com", "12 Santa Cruz, Mumbai", "2001-11-28", "AADH-6789-1285", "verified", "active"),
  ("CUST186", "BB-ACC-5086", "KL Rahul", "9876543286", "kl.rahul186@email.com", "85 Benson Town, Bengaluru", "1994-04-18", "PAN-RAHUK1086D", "verified", "active"),
  ("CUST187", "BB-ACC-5087", "Athiya Shetty", "9876543287", "athiya.s187@email.com", "40 Altamount Rd, Mumbai", "1998-11-05", "AADH-7890-2387", "verified", "active"),
  ("CUST188", "BB-ACC-5088", "Hardik Pandya", "9876543288", "hardik.p188@email.com", "63 Alkapuri, Vadodara", "1995-10-11", "PAN-PANDH2188E", "verified", "active"),
  ("CUST189", "BB-ACC-5089", "Jasprit Bumrah", "9876543289", "jasprit.b189@email.com", "27 Vastrapur, Ahmedabad", "1995-12-06", "AADH-8901-3489", "verified", "active"),

  ("CUST190", "BB-ACC-5090", "Sanjana Ganesan", "9876543290", "sanjana.g190@email.com", "94 Viman Nagar, Pune", "1997-05-06", "PAN-GANES3290F", "verified", "active"),
  ("CUST191", "BB-ACC-5091", "Ravindra Jadeja", "9876543291", "ravindra.j191@email.com", "52 Kalavad Road, Rajkot", "1993-12-06", "AADH-9012-4591", "verified", "active"),
  ("CUST192", "BB-ACC-5092", "Riva Solanki", "9876543292", "riva.s192@email.com", "18 Race Course, Rajkot", "1996-11-02", "PAN-SOLAR4392G", "verified", "active"),
  ("CUST193", "BB-ACC-5093", "Suryakumar Yadav", "9876543293", "surya.y193@email.com", "75 Chembur East, Mumbai", "1994-09-14", "AADH-0123-5693", "verified", "active"),
  ("CUST194", "BB-ACC-5094", "Devisha Shetty", "9876543294", "devisha.s194@email.com", "31 Matunga, Mumbai", "1997-11-16", "PAN-SHETD5494H", "verified", "active"),
  ("CUST195", "BB-ACC-5095", "Kuldeep Yadav", "9876543295", "kuldeep.y195@email.com", "64 Lal Bangla, Kanpur", "1996-12-14", "AADH-1234-6795", "verified", "frozen"),
  ("CUST196", "BB-ACC-5096", "Yuzvendra Chahal", "9876543296", "yuzi.c196@email.com", "88 Sector 14, Gurugram", "1994-07-23", "PAN-CHAHY6596J", "verified", "active"),
  ("CUST197", "BB-ACC-5097", "Dhanashree Verma", "9876543297", "dhanashree.v197@email.com", "42 Goregaon East, Mumbai", "1998-09-27", "AADH-2345-7897", "verified", "active"),
  ("CUST198", "BB-ACC-5098", "Mohammed Siraj", "9876543298", "md.siraj198@email.com", "19 Tolichowki, Hyderabad", "1996-03-13", "PAN-SIRAM7698K", "verified", "active"),
  ("CUST199", "BB-ACC-5099", "Axar Patel", "9876543299", "axar.patel199@email.com", "55 College Rd, Nadiad", "1996-01-20", "AADH-3456-8999", "verified", "active"),
  ("CUST200", "BB-ACC-5100", "Meha Patel", "9876543300", "meha.patel200@email.com", "70 Navrangpura, Ahmedabad", "1998-03-26", "PAN-PATEM8700L", "verified", "active"),
  ("CUST201", "BB-ACC-5101", "Sanju Samson", "9876543301", "sanju.s201@email.com", "26 Vizhinjam, Trivandrum", "1996-11-11", "AADH-4567-9001", "verified", "active"),
  ("CUST202", "BB-ACC-5102", "Charulatha Remesh", "9876543302", "charulatha.r202@email.com", "82 Pattom, Trivandrum", "1997-10-19", "PAN-REMEC9802M", "verified", "active"),

  ("CUST203", "BB-ACC-5103", "Ruturaj Gaikwad", "9876543303", "ruturaj.g203@email.com", "39 Pimple Saudagar, Pune", "1999-01-31", "AADH-5678-0103", "verified", "active"),
  ("CUST204", "BB-ACC-5104", "Utkarsha Pawar", "9876543304", "utkarsha.p204@email.com", "61 Wakad, Pune", "2000-10-13", "PAN-PAWAU0904N", "verified", "active"),
  ("CUST205", "BB-ACC-5105", "Rinku Singh", "9876543305", "rinku.s205@email.com", "14 Marris Road, Aligarh", "1999-10-12", "AADH-6789-1205", "verified", "active"),
  ("CUST206", "BB-ACC-5106", "Yashasvi Jaiswal", "9876543306", "yashasvi.j206@email.com", "48 Kalbadevi, Mumbai", "2002-12-28", "PAN-JAISY1006P", "verified", "active"),
  ("CUST207", "BB-ACC-5107", "Tilak Varma", "9876543307", "tilak.v207@email.com", "73 Barkatpura, Hyderabad", "2002-11-08", "AADH-7890-2307", "verified", "active"),
  ("CUST208", "BB-ACC-5108", "Dhruv Jurel", "9876543308", "dhruv.j208@email.com", "29 Tajganj, Agra", "2001-01-21", "PAN-JURED2108Q", "pending", "active"),
  ("CUST209", "BB-ACC-5109", "Sarfaraz Khan", "9876543309", "sarfaraz.k209@email.com", "91 Kurla West, Mumbai", "1999-10-22", "AADH-8901-3409", "verified", "active"),
  ("CUST210", "BB-ACC-5110", "Arshdeep Singh", "9876543310", "arshdeep.s210@email.com", "54 Kharar, Mohali", "2000-02-05", "PAN-SINGA3210R", "verified", "active"),
  ("CUST211", "BB-ACC-5111", "Ravi Bishnoi", "9876543311", "ravi.b211@email.com", "37 Sardarpura, Jodhpur", "2001-09-05", "AADH-9012-4511", "verified", "active"),
  ("CUST212", "BB-ACC-5112", "Avesh Khan", "9876543312", "avesh.k212@email.com", "66 Palasia, Indore", "1998-12-13", "PAN-KHANA4312S", "verified", "active"),
  ("CUST213", "BB-ACC-5113", "Mukesh Kumar", "9876543313", "mukesh.k213@email.com", "22 Dumraon, Gopalganj", "1995-10-12", "AADH-0123-5613", "verified", "active"),
  ("CUST214", "BB-ACC-5114", "Washington Sundar", "9876543314", "washington.s214@email.com", "80 Triplicane, Chennai", "1999-10-05", "PAN-SUNDW5414T", "verified", "active"),
  ("CUST215", "BB-ACC-5115", "Shivam Dube", "9876543315", "shivam.d215@email.com", "45 Powai, Mumbai", "1995-06-26", "AADH-1234-6715", "verified", "active"),

  ("CUST216", "BB-ACC-5116", "Anjum Khan", "9876543316", "anjum.k216@email.com", "19 Hiranandani, Mumbai", "1997-09-02", "PAN-KHANA6516U", "verified", "active"),
  ("CUST217", "BB-ACC-5117", "Riyan Parag", "9876543317", "riyan.p217@email.com", "68 Beltola, Guwahati", "2001-11-10", "AADH-2345-7817", "verified", "active"),
  ("CUST218", "BB-ACC-5118", "Abhishek Sharma", "9876543318", "abhishek.s218@email.com", "33 Ranjit Avenue, Amritsar", "2000-09-04", "PAN-SHARA7618V", "verified", "active"),
  ("CUST219", "BB-ACC-5119", "Nitish Kumar Reddy", "9876543319", "nitish.r219@email.com", "74 MVP Colony, Visakhapatnam", "2003-05-26", "AADH-3456-8919", "verified", "active"),
  ("CUST220", "BB-ACC-5120", "Harshit Rana", "9876543320", "harshit.r220@email.com", "50 Rohini Sec 9, New Delhi", "2001-12-22", "PAN-RANAH8720W", "verified", "active"),
  ("CUST221", "BB-ACC-5121", "Mayank Yadav", "9876543321", "mayank.y221@email.com", "16 Moti Nagar, New Delhi", "2002-06-17", "AADH-4567-9021", "verified", "active"),
  ("CUST222", "BB-ACC-5122", "Sai Sudharsan", "9876543322", "sai.s222@email.com", "89 West Mambalam, Chennai", "2001-10-15", "PAN-SUDHS9822X", "verified", "active"),
  ("CUST223", "BB-ACC-5123", "Devdutt Padikkal", "9876543323", "devdutt.p223@email.com", "42 RMV Extension, Bengaluru", "2000-07-07", "AADH-5678-0123", "verified", "active"),
  ("CUST224", "BB-ACC-5124", "Venkatesh Iyer", "9876543324", "venkatesh.i224@email.com", "67 Saket Nagar, Indore", "1996-12-25", "PAN-IYERV0924Y", "verified", "active"),
  ("CUST225", "BB-ACC-5125", "Varun Chakravarthy", "9876543325", "varun.c225@email.com", "25 Neelankarai, Chennai", "1993-08-29", "AADH-6789-1225", "verified", "active"),
]

STAFF = [
  ("ADM-01", "Vikram Desai", "ADMIN", "vikram.desai@bytebank.test"),
  ("ADM-02", "Ananya Rao", "ADMIN", "ananya.rao@bytebank.test"),
  ("ADM-03", "Suresh Iyer", "ADMIN", "suresh.iyer@bytebank.test"),
  ("AUD-01", "Karthik Menon", "AUDITOR", "karthik.menon@bytebank.test"),
  ("AUD-02", "Meera Krishnan", "AUDITOR", "meera.krishnan@bytebank.test"),
]

ASSETS = [
  ("AST-01", "Bitcoin", "BTC", "crypto", 8, "65000.00"),
  ("AST-02", "Ethereum", "ETH", "crypto", 8, "3500.00"),
  ("AST-03", "Solana", "SOL", "crypto", 6, "180.00"),
  ("AST-04", "Tata Consultancy Services", "TCS", "stock", 0, "48.50"),
  ("AST-05", "Reliance Industries", "RELIANCE", "stock", 0, "36.00"),
  ("AST-06", "Infosys Limited", "INFY", "stock", 0, "22.75"),
  ("AST-07", "BNB", "BNB", "crypto", 6, "550.00"),
  ("AST-08", "Ripple", "XRP", "crypto", 4, "0.55"),
  ("AST-09", "Cardano", "ADA", "crypto", 4, "0.45"),
  ("AST-10", "Tether", "USDT", "crypto", 2, "1.00"),
  ("AST-11", "HDFC Bank", "HDFCBANK", "stock", 0, "19.00"),
  ("AST-12", "Zomato", "ZOMATO", "stock", 0, "3.00"),
]

def generate():
    lines = [
        "-- ============================================================================",
        "-- BYTEBANK MASTER SEED DATASET",
        "-- Contains all 125 Customer Master Records (CUST101 - CUST225)",
        "-- Core Assets, Staff, System Accounts, Risk Rules, Initial Holdings, Ledger, and History",
        "-- Invariant Guaranteed: holding.quantity == SUM(ledger_entry.signed_quantity)",
        "-- ============================================================================",
        "BEGIN;",
        "",
        "-- Reset all identity sequences to 1 before loading seed dataset",
        "ALTER SEQUENCE customer_customer_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE staff_staff_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE app_user_user_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE account_account_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE asset_asset_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE asset_transaction_transaction_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE ledger_entry_entry_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE transfer_request_request_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE risk_rule_rule_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE risk_assessment_assessment_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE asset_reservation_reservation_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE audit_log_log_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE access_log_access_id_seq RESTART WITH 1;",
        "ALTER SEQUENCE notification_notification_id_seq RESTART WITH 1;",
        ""
    ]

    lines.append("-- 1. ASSET MASTER")
    for aid, name, sym, atype, scale, price in ASSETS:
        lines.append(f"INSERT INTO asset (name, symbol, type, quantity_scale, sim_ref_price) VALUES ('{name}', '{sym}', '{atype}', {scale}, {price});")
    lines.append("")

    lines.append("-- 2. STAFF DIRECTORY")
    for sid, name, role, email in STAFF:
        lines.append(f"INSERT INTO staff (name, role, email) VALUES ('{name}', '{role}', '{email}');")
    lines.append("")

    lines.append("-- 3. SYSTEM ACCOUNTS")
    lines.append("INSERT INTO account (account_no, is_system, account_type, status) VALUES ('BB-TREASURY', true, 'treasury', 'active');")
    lines.append("INSERT INTO account (account_no, is_system, account_type, status) VALUES ('BB-MARKETMAKER', true, 'market_maker', 'active');")
    lines.append("")

    lines.append("-- 4. CUSTOMER AND ACCOUNT RECORDS (125 Customers: CUST101 - CUST225)")
    for i, (cid, acc_no, name, phone, email, addr, dob, id_doc, kyc, status) in enumerate(RAW_CUSTOMERS, 1):
        id_hash = hashlib.sha256(id_doc.encode()).hexdigest()
        last4 = id_doc[-4:]
        lines.append(f"INSERT INTO customer (full_name, phone, email, address, date_of_birth, id_proof_hash, id_proof_last4, kyc_status) "
                     f"VALUES ('{name}', '{phone}', '{email}', '{addr}', '{dob}', '{id_hash}', '{last4}', '{kyc}');")
        lines.append(f"INSERT INTO account (account_no, customer_id, account_type, status) "
                     f"VALUES ('{acc_no}', currval('customer_customer_id_seq'), 'standard', '{status}');")
    lines.append("")

    lines.append("-- 5. APP USERS (Authentication credentials: password is 'password123')")
    lines.append(f"INSERT INTO app_user (username, email, password_hash, role, staff_id) VALUES ('admin', 'admin@bytebank.test', '{PASSWORD_HASH}', 'ADMIN', 1);")
    lines.append(f"INSERT INTO app_user (username, email, password_hash, role, staff_id) VALUES ('auditor', 'auditor@bytebank.test', '{PASSWORD_HASH}', 'AUDITOR', 4);")
    for s_idx, (sid, s_name, s_role, s_email) in enumerate(STAFF, 1):
        u_name = s_email.split('@')[0]
        lines.append(f"INSERT INTO app_user (username, email, password_hash, role, staff_id) VALUES ('{u_name}', '{s_email}', '{PASSWORD_HASH}', '{s_role}', {s_idx}) ON CONFLICT DO NOTHING;")

    for c_idx, (cid, acc_no, name, phone, email, addr, dob, id_doc, kyc, status) in enumerate(RAW_CUSTOMERS, 1):
        u_name = email.split('@')[0]
        lines.append(f"INSERT INTO app_user (username, email, password_hash, role, customer_id) VALUES ('{u_name}', '{email}', '{PASSWORD_HASH}', 'CUSTOMER', {c_idx});")
    lines.append("")

    lines.append("-- 6. RISK RULES (Versioned Rule Screening)")
    rules = [
      ("KYC_VERIFICATION", 1, "REJECT", json.dumps({"require": "verified"}), "Customer KYC verification is mandatory for transfers"),
      ("ACCOUNT_STATUS", 1, "REJECT", json.dumps({"require": "active"}), "Transfers cannot involve frozen accounts"),
      ("INSUFFICIENT_FUNDS", 1, "REJECT", json.dumps({}), "Transfer quantity must not exceed available quantity"),
      ("NEW_COUNTERPARTY", 1, "REQUIRE_EXTRA_CONFIRMATION", json.dumps({}), "First-time transfer to a new counterparty requires secondary confirmation"),
      ("HIGH_VELOCITY", 1, "REQUIRE_EXTRA_CONFIRMATION", json.dumps({"window_hours": 1, "max_transfers": 3}), "High transaction velocity exceeds single-hour frequency limit"),
      ("LARGE_VALUE_THRESHOLD", 1, "REQUIRE_EXTRA_CONFIRMATION", json.dumps({"BTC": 1.5, "ETH": 5.0, "SOL": 25.0, "TCS": 50, "RELIANCE": 50, "INFY": 50, "DEFAULT": 100}), "Single transfer meets or exceeds risk screening threshold"),
    ]
    for code, ver, outcome, params, desc in rules:
        lines.append(f"INSERT INTO risk_rule (code, version, outcome, params, description, active) VALUES ('{code}', {ver}, '{outcome}', '{params}', '{desc}', true);")
    lines.append("")

    lines.append("-- 7. INITIAL FUNDING (Treasury & Market Maker Liquidity Pools)")
    for asset_idx in range(1, len(ASSETS) + 1):
        lines.append(f"INSERT INTO asset_transaction (receiver_account, asset_id, quantity, type, status, completed_at) VALUES (1, {asset_idx}, 10000000.0, 'allocation', 'success', now());")
        lines.append(f"INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity) VALUES (currval('asset_transaction_transaction_id_seq'), 1, {asset_idx}, 10000000.0);")
        lines.append(f"INSERT INTO holding (account_id, asset_id, quantity) VALUES (1, {asset_idx}, 10000000.0);")

        lines.append(f"INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, completed_at) VALUES (1, 2, {asset_idx}, 1000000.0, 'allocation', 'success', now());")
        lines.append(f"INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity) VALUES (currval('asset_transaction_transaction_id_seq'), 1, {asset_idx}, -1000000.0);")
        lines.append(f"INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity) VALUES (currval('asset_transaction_transaction_id_seq'), 2, {asset_idx}, 1000000.0);")
        lines.append(f"UPDATE holding SET quantity = quantity - 1000000.0 WHERE account_id = 1 AND asset_id = {asset_idx};")
        lines.append(f"INSERT INTO holding (account_id, asset_id, quantity) VALUES (2, {asset_idx}, 1000000.0);")
    lines.append("")

    lines.append("-- 8. CUSTOMER INITIAL ALLOCATIONS (Funded from Treasury)")
    def fund_customer(acct_id, asset_id, qty):
        lines.append(f"INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, completed_at) VALUES (1, {acct_id}, {asset_id}, {qty}, 'allocation', 'success', now() - INTERVAL '30 days');")
        lines.append(f"INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity) VALUES (currval('asset_transaction_transaction_id_seq'), 1, {asset_id}, -{qty});")
        lines.append(f"INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity) VALUES (currval('asset_transaction_transaction_id_seq'), {acct_id}, {asset_id}, {qty});")
        lines.append(f"UPDATE holding SET quantity = quantity - {qty} WHERE account_id = 1 AND asset_id = {asset_id};")
        lines.append(f"INSERT INTO holding (account_id, asset_id, quantity) VALUES ({acct_id}, {asset_id}, {qty}) ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = holding.quantity + EXCLUDED.quantity;")

    fund_customer(3, 1, 1.20)  # BTC
    fund_customer(3, 2, 10.50) # ETH
    fund_customer(3, 4, 5.00)  # TCS

    fund_customer(4, 1, 1.00)  # BTC
    fund_customer(4, 2, 5.00)  # ETH

    fund_customer(5, 2, 12.00) # ETH

    fund_customer(7, 3, 60.00) # SOL

    fund_customer(8, 6, 100.00) # INFY

    for c_idx in range(9, len(RAW_CUSTOMERS) + 3):
        fund_customer(c_idx, 1, 0.50)   # 0.5 BTC
        fund_customer(c_idx, 2, 4.00)   # 4.0 ETH
        fund_customer(c_idx, 3, 25.00)  # 25 SOL
        fund_customer(c_idx, 4, 15.00)  # 15 TCS
        fund_customer(c_idx, 5, 20.00)  # 20 RELIANCE
        fund_customer(c_idx, 6, 30.00)  # 30 INFY
        fund_customer(c_idx, 10, 1000.0) # 1000 USDT
    lines.append("")

    lines.append("-- 9. HISTORICAL TRANSACTIONS (Table D: TXN-9001 to TXN-9007)")

    lines.append("-- TXN-9001: Rishi to Priya 0.50 ETH")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, created_at, completed_at) VALUES (3, 5, 2, 0.50, 'transfer', 'success', '2026-10-15 10:30:12+00', '2026-10-15 10:30:13+00');")
    lines.append("INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity, posted_at) VALUES (currval('asset_transaction_transaction_id_seq'), 3, 2, -0.50, '2026-10-15 10:30:13+00'), (currval('asset_transaction_transaction_id_seq'), 5, 2, 0.50, '2026-10-15 10:30:13+00');")
    lines.append("UPDATE holding SET quantity = quantity - 0.50 WHERE account_id = 3 AND asset_id = 2;")
    lines.append("UPDATE holding SET quantity = quantity + 0.50 WHERE account_id = 5 AND asset_id = 2;")

    lines.append("-- TXN-9002: Rahul to Rishi 0.80 BTC")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, created_at, completed_at) VALUES (4, 3, 1, 0.80, 'transfer', 'success', '2026-10-18 14:15:00+00', '2026-10-18 14:15:01+00');")
    lines.append("INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity, posted_at) VALUES (currval('asset_transaction_transaction_id_seq'), 4, 1, -0.80, '2026-10-18 14:15:01+00'), (currval('asset_transaction_transaction_id_seq'), 3, 1, 0.80, '2026-10-18 14:15:01+00');")
    lines.append("UPDATE holding SET quantity = quantity - 0.80 WHERE account_id = 4 AND asset_id = 1;")
    lines.append("UPDATE holding SET quantity = quantity + 0.80 WHERE account_id = 3 AND asset_id = 1;")

    lines.append("-- TXN-9003: Rahul to Sneha 0.80 BTC (Failed: Insufficient balance: 0.20 BTC left)")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, failure_reason, created_at) VALUES (4, 7, 1, 0.80, 'transfer', 'failed', 'Insufficient balance: 0.20 BTC left', '2026-10-18 14:15:01+00');")

    lines.append("-- TXN-9004: Priya buys 20 RELIANCE from Market Maker")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, created_at, completed_at) VALUES (2, 5, 5, 20.00, 'buy', 'success', '2026-10-20 11:05:44+00', '2026-10-20 11:05:45+00');")
    lines.append("INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity, posted_at) VALUES (currval('asset_transaction_transaction_id_seq'), 2, 5, -20.00, '2026-10-20 11:05:45+00'), (currval('asset_transaction_transaction_id_seq'), 5, 5, 20.00, '2026-10-20 11:05:45+00');")
    lines.append("UPDATE holding SET quantity = quantity - 20.00 WHERE account_id = 2 AND asset_id = 5;")
    lines.append("INSERT INTO holding (account_id, asset_id, quantity) VALUES (5, 5, 20.00) ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = holding.quantity + EXCLUDED.quantity;")

    lines.append("-- TXN-9005: Sneha sells 10 SOL to Market Maker")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, created_at, completed_at) VALUES (7, 2, 3, 10.00, 'sell', 'success', '2026-10-22 16:40:19+00', '2026-10-22 16:40:20+00');")
    lines.append("INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity, posted_at) VALUES (currval('asset_transaction_transaction_id_seq'), 7, 3, -10.00, '2026-10-22 16:40:20+00'), (currval('asset_transaction_transaction_id_seq'), 2, 3, 10.00, '2026-10-22 16:40:20+00');")
    lines.append("UPDATE holding SET quantity = quantity - 10.00 WHERE account_id = 7 AND asset_id = 3;")
    lines.append("UPDATE holding SET quantity = quantity + 10.00 WHERE account_id = 2 AND asset_id = 3;")

    lines.append("-- TXN-9006: Aman to Rahul 1.00 ETH (Failed: Sender KYC Pending & Account Frozen)")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, failure_reason, created_at) VALUES (6, 4, 2, 1.00, 'transfer', 'failed', 'Blocked automatically: Sender KYC Pending & Account Frozen', '2026-10-25 03:12:09+00');")

    lines.append("-- TXN-9007: Rahul to Priya 0.50 ETH (Rolled back after server crash simulation)")
    lines.append("INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, failure_reason, created_at) VALUES (4, 5, 2, 0.50, 'transfer', 'failed', 'Server crash mid-transfer; ACID ROLLBACK restored 0.50 ETH to Rahul', '2026-10-27 19:04:55+00');")
    lines.append("")

    lines.append("-- 10. AUDIT LOG RECORDS (Table E: LOG-301 to LOG-307)")
    audit_entries = [
      ("ADM-01 (Vikram Desai)", "KYC_VERIFICATION", "customer:1 (Rishi Sharma)", json.dumps({"kyc_status": "pending"}), json.dumps({"kyc_status": "verified"}), "2026-01-10 11:00:05+00"),
      ("ADM-02 (Ananya Rao)", "ACCOUNT_STATUS_CHANGE", "account:6 (BB-ACC-5004)", json.dumps({"status": "active"}), json.dumps({"status": "frozen", "reason": "Unverified KYC"}), "2026-02-15 09:20:00+00"),
      ("SYSTEM_TRIGGER (TXN-9002)", "HOLDING_BALANCE_UPDATE", "account:4 (BB-ACC-5002)", json.dumps({"quantity": "1.00 BTC"}), json.dumps({"quantity": "0.20 BTC"}), "2026-10-18 14:15:00+00"),
      ("SYSTEM_TRIGGER (TXN-9003)", "RACE_CONDITION_PREVENTED", "account:4 (BB-ACC-5002)", json.dumps({"quantity": "0.20 BTC"}), json.dumps({"result": "Rejected (-0.60 BTC blocked)", "reason": "Insufficient balance"}), "2026-10-18 14:15:01+00"),
      ("SYSTEM_TRIGGER (TXN-9007)", "ACID_ROLLBACK_EXECUTED", "account:4 (BB-ACC-5002)", json.dumps({"temp_debit": "4.00 ETH"}), json.dumps({"restored": "4.50 ETH", "invariant": "Preserved"}), "2026-10-27 19:04:56+00"),
      ("ADM-01 (Vikram Desai)", "STAFF_PROFILE_VIEW", "customer:3 (Priya Nair)", json.dumps({"access_log": "None"}), json.dumps({"profile_viewed": "ADM-01", "purpose": "KYC_VERIFICATION"}), "2026-10-28 17:45:30+00"),
      ("AUD-01 (Karthik Menon)", "AUDITOR_INSPECTION", "Oct_2026_Ledger", json.dumps({"data_modified": "No"}), json.dumps({"read_only_audit": "Completed", "scope": "Masked Transaction Explorer"}), "2026-10-30 12:10:00+00"),
    ]
    for actor, action, res, old_v, new_v, at in audit_entries:
        lines.append(f"INSERT INTO audit_log (actor, action, resource, old_value, new_value, at) VALUES ('{actor}', '{action}', '{res}', '{old_v}', '{new_v}', '{at}');")
    lines.append("")

    lines.append("-- 11. ACCESS LOG RECORDS (Controlled Purpose-Coded Staff Reads)")
    access_entries = [
      (1, "customer:3", "CUSTOMER_PROFILE", "KYC_VERIFICATION", "2026-10-28 17:45:30+00", "REQ-KYC-901"),
      (2, "customer:4", "CUSTOMER_DOCUMENT", "COMPLIANCE_REVIEW", "2026-02-15 09:18:22+00", "REQ-CMP-402"),
      (3, "customer:1", "CUSTOMER_HOLDINGS", "ACCOUNT_SERVICING", "2026-10-20 14:02:11+00", "REQ-SRV-103"),
      (4, "v_auditor_transactions", "MASKED_TRANSACTION_REPORTS", "AUDIT_SAMPLE", "2026-10-30 12:10:00+00", "REQ-AUD-801"),
    ]
    for staff_id, res_id, cat, purpose, at, ref in access_entries:
        lines.append(f"INSERT INTO access_log (staff_id, resource_id, data_category, purpose_code, accessed_at, request_ref) VALUES ({staff_id}, '{res_id}', '{cat}', '{purpose}', '{at}', '{ref}');")
    lines.append("")

    lines.append("-- 12. SAMPLE NOTIFICATIONS")
    lines.append("INSERT INTO notification (customer_id, type, title, body, created_at) VALUES (1, 'WELCOME', 'Welcome to ByteBank', 'Your digital asset account BB-ACC-5001 is active and KYC verified.', now() - INTERVAL '15 days');")
    lines.append("INSERT INTO notification (customer_id, type, title, body, created_at) VALUES (1, 'TRANSFER_RECEIVED', 'Asset Received', 'Received 0.80 BTC from Rahul Verma (BB-ACC-5002).', '2026-10-18 14:15:02+00');")
    lines.append("INSERT INTO notification (customer_id, type, title, body, created_at) VALUES (2, 'SECURITY_ALERT', 'Transfer Warning', 'Simultaneous transfer request B rejected: insufficient balance.', '2026-10-18 14:15:02+00');")
    lines.append("INSERT INTO notification (customer_id, type, title, body, created_at) VALUES (3, 'TRANSFER_RECEIVED', 'Asset Received', 'Received 0.50 ETH from Rishi Sharma (BB-ACC-5001).', '2026-10-15 10:30:14+00');")
    lines.append("")

    lines.append("COMMIT;")

    with open("db/seed/001_seed_master.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Generated 001_seed_master.sql successfully with {len(lines)} lines.")

if __name__ == "__main__":
    generate()
