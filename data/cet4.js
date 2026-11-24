/* 四级冲刺内容库 · 从《大学英语四级备考资料合集》高频部分整理
   结构：items 为可背诵条目；template 类型另有 structure/frames。
   所有条目按“先高频、先得分点”排序，sprint.js 依此生成每日计划。 */
(function (global) {
  'use strict';
  var items = [];

  /* ============ 写作 · 万能句型（24） ============ */
  var wp = [
    ["w-p01", "开头", 1, "There are different opinions among people as to ____. Some people suggest that ____.", "关于……人们有不同的观点。一些人认为……", "议论文开头；____ 处填题目话题，后一句展开一方观点。"],
    ["w-p02", "开头", 1, "There is an old saying ____. It is the experience of our forefathers; however, it is correct in many cases even today.", "俗话说……，它是我们前辈的经验；然而即使在今天，它在许多场合仍然适用。", "名言/哲理类开头；____ 填谚语。"],
    ["w-p03", "开头", 1, "Nowadays, it is common to ____. Many people like ____ because ____. Besides, ____.", "现在……很普遍，许多人喜欢……，因为……，另外……。", "现象类开头；三个空按“现象—态度—原因—补充”展开。"],
    ["w-p04", "开头", 1, "Everything has two sides and ____ is not an exception. It has both advantages and disadvantages.", "任何事物都有两面性，……也不例外，既有有利的一面，也有不利的一面。", "利弊分析类开头，万能句。"],
    ["w-p05", "开头", 1, "People's opinions about ____ vary from person to person. Some people say that ____. To them, ____.", "关于……人们的观点因人而异。一些人说……，在他们看来……。", "观点对比类开头。"],
    ["w-p06", "开头", 1, "____ has become a hot topic among people, especially among the young, and heated debates are right on their way.", "……已成为人们关注的热门话题，尤其在年轻人中，激烈的辩论即将展开。", "社会热点类开头。"],
    ["w-p07", "开头", 1, "____ has been playing an increasingly important role in our day-to-day life. It has brought us a lot of benefits but has created some serious problems as well.", "……在日常生活中发挥着越来越重要的作用，给我们带来许多好处，但也引发了一些严重问题。", "科技/现象类开头，转折自然。"],
    ["w-p08", "开头", 1, "According to the figures in the chart, it can be seen that ____, while ____. Obviously, ____, but why?", "根据图表中的数据可以看出……，而……。显然……，但原因是什么呢？", "图表作文开头；描述数据 + 设问。"],
    ["w-p09", "中间", 1, "On the contrary, there are some people in favor of ____. At the same time, they say ____.", "相反，有些人赞成……，同时他们表示……。", "引出反方观点。"],
    ["w-p10", "中间", 1, "But I don't think it is a very good way to solve ____. For example, ____. Worst of all, ____.", "但我认为这不是解决……的好办法。例如……。最糟糕的是……。", "批驳错误做法；举例 + 递进。"],
    ["w-p11", "中间", 1, "____ is necessary and important to our country's development and construction. First, ____. What's more, ____. Most important of all, ____.", "……对我国的发展和建设必不可少且十分重要。首先……，而且……，最重要的是……。", "谈重要性/措施的三层展开。"],
    ["w-p12", "中间", 1, "There are several measures for us to adopt. First, we can ____.", "有几个可供我们采纳的措施。首先，我们可以……。", "措施段开头，后接 Second/Finally。"],
    ["w-p13", "中间", 1, "Confronted with ____, we should take a series of effective measures to ____. For one thing, ____. For another, ____.", "面对……，我们应采取一系列有效措施来……。一方面……，另一方面……。", "问题解决型主体段。"],
    ["w-p14", "中间", 1, "It is high time that something was done about it. For example, ____. In addition, ____. All these measures will certainly ____.", "早该对此采取行动了。例如……，另外……。所有这些措施肯定会……。", "虚拟语气句型 It is high time that + 过去式。"],
    ["w-p15", "中间", 1, "Why ____? The first reason is that ____. The second reason is ____. The third is ____. For all this, the main cause of ____ is due to ____.", "为什么……？第一个原因是……，第二个原因是……，第三个是……。总的来说，……的主要原因是……。", "原因分析段，层次清晰。"],
    ["w-p16", "中间", 1, "However, just like everything has both its good and bad sides, ____ also has its own disadvantages, such as ____.", "然而，正如任何事物都有好坏两面，……也有其不利之处，例如……。", "让步段，避免观点绝对化。"],
    ["w-p17", "结尾", 1, "As far as I am concerned, I agree with the latter opinion to some extent. I think that ____.", "就我而言，我在某种程度上同意后一种观点。我认为……。", "个人观点结尾。"],
    ["w-p18", "结尾", 1, "In a word, the whole society should pay close attention to the problem of ____. Only in this way can ____ in the future.", "总之，全社会都应密切关注……问题。只有这样，将来才能……。", "呼吁式结尾；Only in this way 后倒装。"],
    ["w-p19", "结尾", 1, "Personally, I believe that ____. Consequently, I'm confident that a bright future is awaiting us because ____.", "我个人认为……。因此，我坚信美好的未来在等着我们，因为……。", "积极展望式结尾。"],
    ["w-p20", "结尾", 1, "With the development of society, ____. So it is urgent and necessary to ____. If every member is willing to contribute himself to the society, it will be better and better.", "随着社会发展……。因此迫切需要……。如果每个人都愿为社会贡献力量，社会将越来越好。", "社会类结尾，考场上很稳。"],
    ["w-p21", "结尾", 1, "For my part, I think it reasonable to ____. Only in this way can you ____.", "就我而言，我认为……是合理的。只有这样你才能……。", "建议式结尾；倒装加分。"],
    ["w-p22", "结尾", 1, "In my opinion, I think it necessary to ____. The reasons are as follows. First, ____. Second, ____. Last but not least, ____.", "我认为有必要……。原因如下：第一……，第二……，最后但同样重要的是……。", "理由罗列式结尾。"],
    ["w-p23", "结尾", 1, "From what has been discussed above, we may reasonably arrive at the conclusion that ____.", "综上所述，我们可以合理得出结论……。", "万能结论句。"],
    ["w-p24", "结尾", 1, "If we cannot take useful means, we may not control this trend, and some undesirable results may come out unexpectedly, so what we should do is ____.", "如果我们不采取有效手段，可能无法控制这一趋势，一些不良后果会意外出现，所以我们该做的是……。", "警示式结尾，适合负面现象。"]
  ];
  wp.forEach(function (a) {
    items.push({ id: a[0], track: "writing", type: "pattern", part: a[1], hot: !!a[2], en: a[3], zh: a[4], note: a[5] });
  });

  /* ============ 写作 · 模板（9） ============ */
  var wt = [
    ["w-t01", "对立观点式", "有人认为 A 好，有人认为 B 好，谈谈你的看法", ["开头：引出争议 + 双方观点", "主体：支持方理由 2 条，反对方理由 1 条 + 例子", "结尾：我的看法 + 理由"], ["Some people are in favor of the idea of doing X. They point out the fact that ... They also argue that ...", "However, other people stand on a different ground. They consider it harmful to do X. They firmly point out that ...", "There is some truth in both arguments. But I think the advantages of X outweigh the disadvantages."], "开头用 There are different opinions...；主体用 For one thing / For another；结尾用 As far as I am concerned..."],
    ["w-t02", "现象分析式", "描述一个社会现象，分析原因、影响并提建议", ["开头：描述现象/数据", "主体一：2-3 条原因", "主体二：对社会和生活的影响", "结尾：措施 + 预测"], ["Nowadays, there exists an increasingly serious problem of ...", "There are a couple of reasons behind this phenomenon. First, ... Second, ...", "X has caused substantial impact on society and our daily life.", "A dozen of measures are supposed to be taken to prevent X from bringing us more harm.", "Based on the above discussion, I can easily forecast that ..."], "现象类最稳模板；原因段用 First/Second/Last but not least。"],
    ["w-t03", "图表作文", "柱状图/折线图/表格描述变化并分析原因", ["开头：点明图表 + 总体趋势", "主体一：具体数据变化（峰值/对比）", "主体二：2-3 条原因", "结尾：预测/建议"], ["It is obvious in the chart that the number of Y has undergone dramatic changes.", "It has gone up / fallen considerably in recent years.", "What is the reason for this change? Mainly there are ... reasons behind the situation.", "From the above discussion, we have enough reason to predict that ..."], "数据不会写就用 increase / decrease / reach its peak / remain stable。"],
    ["w-t04", "名言哲理", "给出一句英文名言或哲理，谈理解与启示", ["开头：引出名言 + 解释含义", "主体：论点 2 条 + 例子", "结尾：呼应名言 + 行动建议"], ["There is a widespread saying that ... Funny as it is, the saying reflects the fact that ...", "Our life involves all kinds of obstacles and setbacks. Therefore, ...", "All in all, ..., just as the old saying goes, ..."], "名言类不要翻译整句，抓关键词解释。"],
    ["w-t05", "建议信", "给同学/学校/朋友提建议", ["称呼", "说明写信目的 + 发现问题", "2-3 条具体建议 + 理由", "结尾期待 + 署名"], ["Dear ..., I am writing to express my concern about / put forward my suggestions about ...", "I have noticed that ... I am really worried about it.", "In my opinion, you / we should ...", "Thank you for your attention. I wish you would take my advice into consideration.", "Yours sincerely, ..."], "应用文格式分不能丢：称呼、正文、结尾、署名。"],
    ["w-t06", "感谢信", "感谢老师/同学/朋友的帮助", ["称呼", "点明感谢 + 具体事由", "帮助带来的影响", "再次感谢 + 回请/祝福", "署名"], ["Dear ..., I am writing this letter to express my sincere gratitude for ...", "Had it not been for your assistance in ..., I fear that ...", "I shall always remember ...", "Again, I would like to express my thanks to ...", "Yours sincerely, ..."], "Had it not been for... 是虚拟语气加分句。"],
    ["w-t07", "求职信", "申请职位/暑期工/志愿者", ["称呼", "说明申请职位 + 信息来源", "自我介绍 + 匹配优势", "期待面试 + 署名"], ["Dear ..., I am ... and I would like to apply for the position of ... posted on ...", "I am a major in ... and I will graduate in ...", "I believe my qualifications are an ideal match for your requirements.", "I would appreciate your time in reviewing my enclosed resume.", "Yours sincerely, ..."], "没有真实经历就写课程、社团、性格优势，别编造。"],
    ["w-t08", "邀请信", "邀请参加活动/讲座/比赛", ["称呼", "点明活动 + 时间地点", "活动内容 + 意义", "期待回复 + 联系方式", "署名"], ["Dear ..., I am writing this letter to invite you to ...", "It would be a great honor for us if you could attend ...", "The event will be held at ... on ...", "Please contact us via ... if you can come.", "Yours sincerely, ..."], "邀请信语气礼貌，多用 would / could。"],
    ["w-t09", "道歉信", "因失约/损坏/迟到等道歉", ["称呼", "直接道歉 + 说明原因", "补救措施", "再次道歉 + 期待谅解", "署名"], ["Dear ..., I am writing to make an apology to you for ...", "I am terribly sorry for my fault; it was not my intention to ...", "To make up for my mistake, I would like to ...", "Again, I deeply apologize for the problems my actions caused.", "Yours sincerely, ..."], "道歉信第一句就道歉，不要绕。"]
  ];
  wt.forEach(function (a) {
    items.push({ id: a[0], track: "writing", type: "template", name: a[1], scene: a[2], structure: a[3], frames: a[4], note: a[5], hot: true });
  });

  /* ============ 写作 · 高级词/搭配（45） ============ */
  var wv = [
    ["w-v01", "approve of", "赞同，支持", "替换 agree with；approve of sth/sb", "Most parents approve of the new policy."],
    ["w-v02", "advocate", "倡导，支持", "advocate doing sth；比 support 正式", "Many experts advocate reducing screen time."],
    ["w-v03", "object to", "反对", "object to doing sth；to 是介词", "Some students object to the new rule."],
    ["w-v04", "hold the view that", "认为……", "替换 I think that，写作开头很好用", "I hold the view that practice makes perfect."],
    ["w-v05", "emerge", "出现，兴起", "emerge as... 作为……出现", "Online education has emerged as a new trend."],
    ["w-v06", "prevail", "盛行，普遍存在", "prevail in/among...", "This custom still prevails in rural areas."],
    ["w-v07", "gain popularity", "流行起来", "替换 become popular", "Shared bikes gained popularity overnight."],
    ["w-v08", "surge", "激增，猛增", "替换 increase rapidly", "The number of users surged last year."],
    ["w-v09", "soar", "飙升", "soar to... 飙升至", "House prices have soared in big cities."],
    ["w-v10", "decline", "下降，衰退", "替换 decrease，更正式", "The birth rate has declined steadily."],
    ["w-v11", "fluctuate", "波动", "图表作文高频", "The figure fluctuated between 20 and 30."],
    ["w-v12", "prevalent", "普遍的，盛行的", "be prevalent among...", "This view is prevalent among young people."],
    ["w-v13", "widespread", "广泛的", "widespread concern 广泛关注", "The issue has aroused widespread concern."],
    ["w-v14", "benefit", "有益于；受益", "benefit sb；benefit from", "Reading benefits us in many ways."],
    ["w-v15", "contribute to", "有助于，促成", "to 是介词，后接名词/doing", "Exercise contributes to good health."],
    ["w-v16", "facilitate", "促进，推动", "替换 help promote", "The Internet facilitates communication."],
    ["w-v17", "exert a positive influence on", "对……产生积极影响", "高级句式，替换 be good for", "Teachers exert a positive influence on students."],
    ["w-v18", "harm", "损害", "harm sb/sth；be harmful to", "Staying up late harms your health."],
    ["w-v19", "lead to", "导致", "lead to negative consequences", "Carelessness may lead to serious mistakes."],
    ["w-v20", "significant", "重要的，显著的", "be significant for...", "This is a significant change for us."],
    ["w-v21", "vital", "至关重要的", "be vital to/for...", "Water is vital to life."],
    ["w-v22", "crucial", "关键的", "be crucial to/for...", "Effort is crucial to success."],
    ["w-v23", "essential", "必要的，重要的", "be essential to/for...", "Sleep is essential for health."],
    ["w-v24", "take measures to", "采取措施做某事", "take effective measures to do", "The government took measures to reduce pollution."],
    ["w-v25", "adopt", "采取，采用", "adopt measures / a policy", "We should adopt a positive attitude."],
    ["w-v26", "propose", "提议，建议", "propose doing sth / that...", "He proposed holding a class meeting."],
    ["w-v27", "furthermore", "此外，而且", "递进，替换 and/also", "Furthermore, it saves both time and money."],
    ["w-v28", "nevertheless", "然而，不过", "转折，较正式", "Nevertheless, the problem remains unsolved."],
    ["w-v29", "therefore", "因此", "因果，替换 so", "Therefore, we must take action now."],
    ["w-v30", "in conclusion", "总之", "结尾总结", "In conclusion, reading is of great value."],
    ["w-v31", "a great number of", "许多（可数）", "后接可数名词复数", "A great number of students joined the activity."],
    ["w-v32", "a large amount of", "许多（不可数）", "后接不可数名词", "A large amount of money was spent."],
    ["w-v33", "an increasing number of", "越来越多的", "后接可数名词复数", "An increasing number of people choose online shopping."],
    ["w-v34", "address", "解决，处理", "address a problem", "We must address the issue of food waste."],
    ["w-v35", "with the rapid development of economy", "随着经济的快速发展", "现象类开头", "With the rapid development of economy, people's living standards have improved."],
    ["w-v36", "arouse wide public concern", "引起广泛的公众关注", "替换 draw attention", "The accident has aroused wide public concern."],
    ["w-v37", "be faced with new opportunities and challenges", "面临新的机遇和挑战", "时代背景句", "We are faced with new opportunities and challenges."],
    ["w-v38", "play an increasingly important role in", "在……中发挥日益重要的作用", "in 后接名词/doing", "Technology plays an increasingly important role in education."],
    ["w-v39", "lay a solid foundation for", "为……打下坚实基础", "for 后接名词", "Practice lays a solid foundation for success."],
    ["w-v40", "attach great importance to", "重视", "to 是介词", "Schools attach great importance to students' health."],
    ["w-v41", "widen one's horizon", "开阔眼界", "也可说 broaden one's vision", "Travel helps widen our horizon."],
    ["w-v42", "relieve stress", "缓解压力", "替换 reduce pressure", "Listening to music can relieve stress."],
    ["w-v43", "keep pace with", "跟上", "keep pace with the times", "We should keep pace with social development."],
    ["w-v44", "make joint efforts", "共同努力", "make joint efforts to do", "Both sides should make joint efforts to solve the problem."],
    ["w-v45", "take many factors into consideration", "考虑诸多因素", "take sth into consideration", "We should take many factors into consideration."]
  ];
  wv.forEach(function (a) {
    items.push({ id: a[0], track: "writing", type: "word", en: a[1], zh: a[2], note: a[3], example: a[4], hot: true });
  });

  /* ============ 翻译 · 高频词（80） ============ */
  var tv = [
    ["t-v001", "the Spring Festival", "春节", "节日", "也可说 Lunar New Year"],
    ["t-v002", "the Lantern Festival", "元宵节", "节日", "农历正月十五"],
    ["t-v003", "Tomb Sweeping Day", "清明节", "节日", "也可说 Qingming Festival"],
    ["t-v004", "the Dragon Boat Festival", "端午节", "节日", "纪念屈原"],
    ["t-v005", "the Mid-Autumn Festival", "中秋节", "节日", "农历八月十五"],
    ["t-v006", "the Double Ninth Festival", "重阳节", "节日", "农历九月初九"],
    ["t-v007", "lunar calendar", "农历", "节日", "对应 solar calendar 公历"],
    ["t-v008", "the fifteenth day of the first lunar month", "正月十五", "节日", "元宵节日期"],
    ["t-v009", "family reunion", "家庭团聚", "节日", "reunion 名词“团聚”"],
    ["t-v010", "couplets", "春联", "节日", "Spring Festival couplets"],
    ["t-v011", "firecrackers", "鞭炮", "节日", "set off firecrackers 放鞭炮"],
    ["t-v012", "lucky money", "压岁钱", "节日", "也可说 red envelopes"],
    ["t-v013", "paper cutting", "剪纸", "非遗", "不可数"],
    ["t-v014", "Chinese knot", "中国结", "非遗", "可数"],
    ["t-v015", "shadow play", "皮影戏", "非遗", "也叫 shadow puppetry"],
    ["t-v016", "calligraphy", "书法", "非遗", "不可数"],
    ["t-v017", "Peking Opera", "京剧", "非遗", "注意 Peking 拼写"],
    ["t-v018", "Tai Chi", "太极", "非遗", "也可说 Tai Chi Chuan"],
    ["t-v019", "the Four Great Inventions", "四大发明", "历史", "造纸术、印刷术、火药、指南针"],
    ["t-v020", "the Silk Road", "丝绸之路", "历史", "古代贸易通道"],
    ["t-v021", "the Great Wall", "长城", "地标", "世界文化遗产"],
    ["t-v022", "the Palace Museum", "故宫", "地标", "旧称 the Forbidden City"],
    ["t-v023", "the Terracotta Warriors", "兵马俑", "地标", "秦始皇陵兵马俑"],
    ["t-v024", "traditional Chinese medicine", "中医", "文化", "简称 TCM"],
    ["t-v025", "intangible cultural heritage", "非物质文化遗产", "文化", "intangible 无形的"],
    ["t-v026", "cultural heritage", "文化遗产", "文化", "可数/不可数均可"],
    ["t-v027", "cultural exchange", "文化交流", "文化", "也可说 cultural communication"],
    ["t-v028", "cultural diversity", "文化多样性", "文化", "diversity 多样性"],
    ["t-v029", "pass down from generation to generation", "代代相传", "文化", "被动：be passed down"],
    ["t-v030", "date back to", "追溯到", "文化", "不用进行时"],
    ["t-v031", "the Qin Dynasty", "秦朝", "历史", "dynasty 朝代"],
    ["t-v032", "the Tang Dynasty", "唐朝", "历史", "唐朝文化繁荣"],
    ["t-v033", "the Ming and Qing Dynasties", "明清时期", "历史", "注意复数"],
    ["t-v034", "Confucius", "孔子", "历史", "儒家创始人"],
    ["t-v035", "Confucianism", "儒家思想", "历史", "不可数"],
    ["t-v036", "Taoism", "道教", "历史", "也可指道家思想"],
    ["t-v037", "the Book of Songs", "《诗经》", "典籍", "中国最早诗歌总集"],
    ["t-v038", "the Analects", "《论语》", "典籍", "记录孔子言行"],
    ["t-v039", "Journey to the West", "《西游记》", "典籍", "四大名著之一"],
    ["t-v040", "Dream of Red Mansions", "《红楼梦》", "典籍", "也可说 A Dream of Red Mansions"],
    ["t-v041", "Romance of the Three Kingdoms", "《三国演义》", "典籍", "四大名著之一"],
    ["t-v042", "Water Margin", "《水浒传》", "典籍", "四大名著之一"],
    ["t-v043", "imperial examination", "科举考试", "历史", "imperial 帝国的"],
    ["t-v044", "the Four Treasures of the Study", "文房四宝", "文化", "笔墨纸砚"],
    ["t-v045", "porcelain", "瓷器", "文化", "不可数；china 小写也指瓷器"],
    ["t-v046", "high-speed railway", "高速铁路", "社会", "高铁"],
    ["t-v047", "mobile payment", "移动支付", "科技", "扫码支付"],
    ["t-v048", "online shopping", "网上购物", "社会", "网购"],
    ["t-v049", "sharing economy", "共享经济", "经济", "共享单车等"],
    ["t-v050", "artificial intelligence", "人工智能", "科技", "简称 AI"],
    ["t-v051", "big data", "大数据", "科技", "不可数"],
    ["t-v052", "digital economy", "数字经济", "经济", "digital 数字的"],
    ["t-v053", "urbanization", "城市化", "社会", "urban 城市的"],
    ["t-v054", "population aging", "人口老龄化", "社会", "aging 老龄化"],
    ["t-v055", "living standard", "生活水平", "社会", "也可说 standard of living"],
    ["t-v056", "social security", "社会保障", "社会", "社保"],
    ["t-v057", "poverty alleviation", "扶贫", "社会", "alleviation 缓解"],
    ["t-v058", "rural revitalization", "乡村振兴", "社会", "revitalization 振兴"],
    ["t-v059", "sustainable development", "可持续发展", "环境", "sustainable 可持续的"],
    ["t-v060", "environmental protection", "环境保护", "环境", "protect the environment"],
    ["t-v061", "garbage classification", "垃圾分类", "环境", "也可说 waste sorting"],
    ["t-v062", "renewable energy", "可再生能源", "环境", "renewable 可再生的"],
    ["t-v063", "carbon neutrality", "碳中和", "环境", "carbon peaking 碳达峰"],
    ["t-v064", "quality education", "素质教育", "教育", "quality-oriented education"],
    ["t-v065", "vocational education", "职业教育", "教育", "vocational 职业的"],
    ["t-v066", "compulsory education", "义务教育", "教育", "compulsory 强制的"],
    ["t-v067", "all-round development", "全面发展", "教育", "all-round 全面的"],
    ["t-v068", "innovation", "创新", "科技", "innovate 动词"],
    ["t-v069", "infrastructure", "基础设施", "社会", "不可数"],
    ["t-v070", "public transport", "公共交通", "社会", "public transportation 美式"],
    ["t-v071", "cultural industry", "文化产业", "文化", "cultural products 文化产品"],
    ["t-v072", "tourism", "旅游业", "经济", "tourist 游客"],
    ["t-v073", "traditional culture", "传统文化", "文化", "traditional Chinese culture"],
    ["t-v074", "national identity", "民族认同", "文化", "identity 身份/认同"],
    ["t-v075", "social harmony", "社会和谐", "社会", "harmonious 和谐的"],
    ["t-v076", "ancient civilization", "古代文明", "历史", "civilization 文明"],
    ["t-v077", "outstanding folk art", "优秀民间艺术", "文化", "folk 民间的"],
    ["t-v078", "historic site", "历史遗迹", "文化", "historic 有历史意义的"],
    ["t-v079", "World Heritage List", "世界遗产名录", "文化", " UNESCO 联合国教科文组织"],
    ["t-v080", "preserve", "保护，保存", "文化", "preserve cultural heritage"]
  ];
  tv.forEach(function (a) {
    items.push({ id: a[0], track: "translation", type: "vocab", en: a[1], zh: a[2], topic: a[3], note: a[4], hot: true });
  });

  /* ============ 翻译 · 救命短语（45） ============ */
  var tp = [
    ["t-p01", "be located in", "位于（大地点）", "小地点用 be located at"],
    ["t-p02", "be known for", "因……而闻名", "也可说 be famous/renowned for"],
    ["t-p03", "be hailed as", "被誉为", "hail 欢呼/称赞"],
    ["t-p04", "be recognized as", "被公认为", "recognize 认可"],
    ["t-p05", "be named after", "以……命名", "after 不能换成 by"],
    ["t-p06", "consist of", "由……组成", "不用被动：be consisted of 错"],
    ["t-p07", "be inseparable from", "与……密不可分", "inseparable 不可分离的"],
    ["t-p08", "embody", "体现", "也可说 reflect/show"],
    ["t-p09", "originate from", "起源于", "也可说 derive/stem from"],
    ["t-p10", "play an important role in", "在……中起重要作用", "role in doing sth"],
    ["t-p11", "date back to", "追溯到", "常与现在完成时连用"],
    ["t-p12", "rush to", "涌入", "也可说 swarm to"],
    ["t-p13", "flourish", "蓬勃发展", "也可说 boom/thrive"],
    ["t-p14", "make joint efforts", "共同努力", "effort 用复数"],
    ["t-p15", "broaden one's horizon", "开阔眼界", "horizon 用复数更常见"],
    ["t-p16", "enjoy the reputation of", "享有……的美誉", "reputation 声誉"],
    ["t-p17", "all walks of life", "各行各业", "walk of life 行业"],
    ["t-p18", "at home and abroad", "国内外", "abroad 副词，前不加 in"],
    ["t-p19", "one of the most famous attractions", "最著名的景点之一", "one of + 复数"],
    ["t-p20", "be different from place to place", "各地不同", "也可说 vary from place to place"],
    ["t-p21", "be abundant in", "富于，盛产", "abundant 丰富的"],
    ["t-p22", "be essential to", "对……必不可少", "to 是介词"],
    ["t-p23", "attach great importance to", "重视", "to 是介词"],
    ["t-p24", "make contributions to", "为……做贡献", "to 是介词"],
    ["t-p25", "adapt oneself to", "使自己适应", "to 是介词"],
    ["t-p26", "take measures to", "采取措施", "measure 用复数"],
    ["t-p27", "raise awareness of", "提高……意识", "awareness 不可数"],
    ["t-p28", "benefit from", "从……受益", "benefit sb 使某人受益"],
    ["t-p29", "be committed to", "致力于", "to 是介词，后接 doing"],
    ["t-p30", "in addition", "此外", "后接句子或名词短语"],
    ["t-p31", "due to", "由于", "后接名词，不接句子"],
    ["t-p32", "as a result", "结果", "后接结果"],
    ["t-p33", "in conclusion", "总之", "结论段开头"],
    ["t-p34", "not only ... but also", "不仅……而且", "连接并列成分"],
    ["t-p35", "rather than", "而不是", "连接平行结构"],
    ["t-p36", "compared with", "与……相比", "也可说 in comparison with"],
    ["t-p37", "with the development of", "随着……的发展", "后接名词"],
    ["t-p38", "witness", "见证", "place/time + witness + 变化"],
    ["t-p39", "symbolize", "象征", "symbol 名词；symbolic 形容词"],
    ["t-p40", "carry forward", "发扬", "carry forward the tradition"],
    ["t-p41", "inherit", "继承", "inherit the tradition"],
    ["t-p42", "be regarded as", "被视为", "regard ... as ..."],
    ["t-p43", "contribute to", "有助于", "to 是介词"],
    ["t-p44", "be faced with", "面临", "face sth 也成立"],
    ["t-p45", "in terms of", "在……方面", "后接名词"]
  ];
  tp.forEach(function (a) {
    items.push({ id: a[0], track: "translation", type: "phrase", en: a[1], zh: a[2], note: a[3], hot: true });
  });

  /* ============ 翻译 · 高级句型（20） ============ */
  var ts = [
    ["t-s01", "As one of the most important cultural heritages of China, ____ is a kind of ____ that ____.", "作为中国最重要的文化遗产之一，……是一种……的……。", "文化", "介绍书法、京剧、传统节日等"],
    ["t-s02", "With a history of more than ____ years, ____ has been passed down from generation to generation and has become an integral part of Chinese culture.", "拥有超过……年的历史，……代代相传，已成为中国文化不可或缺的一部分。", "文化", "integral 不可或缺的"],
    ["t-s03", "In recent years, ____ has spread widely at home and abroad, helping more people understand the charm of Chinese culture.", "近年来，……在国内外广泛传播，帮助更多人了解中国文化的魅力。", "文化", "charm 魅力"],
    ["t-s04", "With the rapid development of ____, ____ have been widely used in various fields of people's life.", "随着……的快速发展，……已广泛应用于人们生活的各个领域。", "科技", "various fields 各个领域"],
    ["t-s05", "____ has greatly promoted the development of ____, making people's work and life more convenient.", "……极大地推动了……的发展，使人们的工作和生活更加便利。", "科技", "making 作结果状语"],
    ["t-s06", "It is widely acknowledged that ____ has become an indispensable part of modern society, playing an important role in ____.", "众所周知，……已成为现代社会不可或缺的一部分，在……中发挥着重要作用。", "科技", "indispensable 不可或缺的"],
    ["t-s07", "In recent years, China has made remarkable progress in ____, which has greatly improved people's quality of life.", "近年来，中国在……领域取得了显著进步，极大地提高了人们的生活质量。", "社会", "which 引导非限制性定语从句"],
    ["t-s08", "With the improvement of people's living standards, ____.", "随着人们生活水平的提高，……。", "社会", "后接生活变化"],
    ["t-s09", "As a common social phenomenon in modern society, ____ has attracted widespread attention from all walks of life.", "作为现代社会常见的社会现象，……受到了社会各界的广泛关注。", "社会", "all walks of life 各行各业"],
    ["t-s10", "Protecting the ecological environment is crucial to the sustainable development of human society, which is the common responsibility of all people.", "保护生态环境对人类社会的可持续发展至关重要，这是全体人民的共同责任。", "环境", "动名词作主语"],
    ["t-s11", "The government has taken a series of effective measures to ____, which has achieved remarkable results.", "政府采取了一系列有效措施来……，取得了显著成效。", "环境", "which 指代前面整件事"],
    ["t-s12", "In recent years, China has attached great importance to ____, promoting the all-round development of students.", "近年来，中国高度重视……，促进学生的全面发展。", "教育", "promoting 作结果状语"],
    ["t-s13", "____ plays a vital role in cultivating ____, laying a solid foundation for social progress.", "……在培养……方面发挥着至关重要的作用，为社会进步奠定坚实基础。", "教育", "cultivate 培养"],
    ["t-s14", "It is + adj. + to do sth.", "做某事是……的。", "万能", "it 作形式主语；adj 用 important/necessary/crucial"],
    ["t-s15", "There is no doubt that ____.", "毫无疑问……。", "万能", "也可说 It is undoubted that"],
    ["t-s16", "Not only ____ but also ____.", "不仅……而且……。", "万能", "连接并列成分，注意结构一致"],
    ["t-s17", "The more ____, the more ____.", "越……越……。", "万能", "比较级叠用"],
    ["t-s18", "Only in this way can ____.", "只有这样，才能……。", "万能", "Only + 状语置句首，部分倒装"],
    ["t-s19", "It is high time that ____.", "早该……了。", "万能", "that 从句用过去式"],
    ["t-s20", "____ is not only ____ but also ____.", "……不仅是……而且是……。", "万能", "写作、翻译都能用"]
  ];
  ts.forEach(function (a) {
    items.push({ id: a[0], track: "translation", type: "pattern", en: a[1], zh: a[2], topic: a[3], note: a[4], hot: true });
  });

  /* 给每条补默认字段，便于统一渲染 */
  items.forEach(function (it, i) {
    it.seq = i;
    if (it.hot === undefined) it.hot = false;
    if (!it.topic) it.topic = it.track === "writing" ? "写作通用" : "翻译通用";
  });

  var writing = items.filter(function (x) { return x.track === "writing"; });
  var translation = items.filter(function (x) { return x.track === "translation"; });

  global.StudyHubData = global.StudyHubData || {};
  global.StudyHubData.cet4 = {
    meta: {
      title: "四级冲刺",
      source: "《大学英语四级备考资料合集》高频部分整理",
      examDateDefault: "2026-12-19",
      writingCount: writing.length,
      translationCount: translation.length,
      total: items.length
    },
    items: items,
    writing: writing,
    translation: translation,
    tips: [
      "作文先背 3 个开头 + 3 个结尾，再补模板；考场上先保证结构完整。",
      "翻译先翻主干（谁/做什么/怎么样），再补修饰；不会的词用简单词解释。",
      "每天先清“到期复习”，再背新卡；模糊的卡当天必须再回看一次。",
      "考前 3 天停止背新内容，只滚动模板、句型和高频错题。",
      "检测错题比反复看更有效：错一次，就在错题本里多待一天。"
    ]
  };
})(window);