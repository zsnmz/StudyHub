window.StudyHubData = window.StudyHubData || {};
(function () {
  var D = window.StudyHubData;
  var words = (D.cet6Vocab && D.cet6Vocab.words) || [];

  function p(id, part, en, zh, note) {
    return { id: id, track: 'writing', type: 'pattern', hot: true, part: part, en: en, zh: zh, note: note || '', example: '' };
  }
  function v(id, en, zh, note) {
    return { id: id, track: 'writing', type: 'word', hot: true, part: '写作词块', en: en, zh: zh, note: note || '', example: '' };
  }

  var patterns = [
    p('w-p01', '段首', 'There are different opinions among people as to ____. Some people suggest that ____.', '关于……人们有不同的观点。一些人认为……', '议论文开头，引出争议'),
    p('w-p02', '段首', 'There is an old saying that ____. It is the experience of our forefathers, yet it is still applicable in many cases today.', '常言道……这是前人的经验，但今天在许多场合仍然适用。', '名言/谚语开头'),
    p('w-p03', '段首', 'Nowadays, it is common to ____. Many people like ____ because ____. Besides, ____.', '如今……很普遍。许多人喜欢……因为……，此外……', '现象+原因+补充'),
    p('w-p04', '段首', 'Everything has two sides and ____ is not an exception. It has both advantages and disadvantages.', '任何事物都有两面性，……也不例外，既有有利的一面，也有不利的一面。', '辩证开头'),
    p('w-p05', '段首', 'Man is now facing a big problem ____, which is becoming more and more serious.', '人类正面临一个严重问题……，而且越来越严重。', '问题型开头'),
    p('w-p06', '段首', '____ has become a hot topic among people, especially among the young, and heated debates are right on their way.', '……已成为人们热议的话题，尤其在年轻人中，激烈的辩论即将展开。', '热点话题开头'),
    p('w-p07', '段首', '____ has been playing an increasingly important role in our daily life. It has brought us many benefits but also created some serious problems.', '……在日常生活中发挥着越来越重要的作用，既带来好处，也带来一些问题。', '重要性+两面性'),
    p('w-p08', '段首', 'According to the figures in the chart, it can be seen that ____ while ____. Obviously, ____, but why?', '根据图表数据可以看出……而……。显然……，但原因何在？', '图表开头'),
    p('w-p09', '段首', 'With the rapid development of ____, more and more attention has been paid to ____.', '随着……的快速发展，人们越来越关注……', '背景式开头'),
    p('w-p10', '段首', 'It is widely acknowledged that ____ plays an indispensable role in ____.', '人们普遍认为，……在……中不可或缺。', '公认观点开头'),

    p('w-p11', '中间段', 'On the contrary, there are some people in favor of ____. They believe that ____.', '相反，有些人赞成……，他们认为……', '对比论证'),
    p('w-p12', '中间段', 'But I do not think it is a good way to solve ____. For example, ____. Worst of all, ____.', '但我认为这不是解决……的好办法。例如……。最糟糕的是……', '反驳+举例'),
    p('w-p13', '中间段', '____ is necessary and important to our country\'s development. First, ____. What is more, ____. Most important of all, ____.', '……对国家发展必要且重要。首先……，而且……，最重要的是……', '分层论证'),
    p('w-p14', '中间段', 'There are several measures for us to adopt. First, we can ____. Second, ____.', '有几个可供我们采纳的措施。首先……，其次……', '措施段'),
    p('w-p15', '中间段', 'Confronted with ____, we should take a series of effective measures to ____. For one thing, ____. For another, ____.', '面对……，我们应采取一系列有效措施来……。一方面……，另一方面……', '问题解决段'),
    p('w-p16', '中间段', 'Why ____? The first reason is that ____. The second reason is that ____. The third is that ____.', '为什么……？第一个原因是……，第二个是……，第三个是……', '原因分析'),
    p('w-p17', '中间段', 'However, just like everything has both good and bad sides, ____ also has its own disadvantages, such as ____.', '然而，正如事物都有好坏两面，……也有其缺点，例如……', '让步段'),
    p('w-p18', '中间段', 'Nonetheless, I believe that ____ is more advantageous, because ____.', '尽管如此，我相信……更有利，因为……', '转折表态'),
    p('w-p19', '中间段', 'I fully agree with the statement that ____ because ____.', '我完全同意……这一说法，因为……', '同意的理由'),
    p('w-p20', '中间段', 'A case in point is ____, which demonstrates that ____.', '一个恰当的例子是……，它表明……', '举例论证'),

    p('w-p21', '结尾', 'As far as I am concerned, I agree with the latter opinion to some extent. I think that ____.', '就我而言，我在某种程度上同意后一种观点。我认为……', '权衡后表态'),
    p('w-p22', '结尾', 'In a word, the whole society should pay close attention to ____. Only in this way can ____ in the future.', '总之，全社会应密切关注……。只有这样，将来才能……', '呼吁+倒装'),
    p('w-p23', '结尾', 'Personally, I believe that ____. Consequently, I am confident that a bright future is awaiting us because ____.', '我个人相信……。因此，我相信美好的未来在等着我们，因为……', '展望未来'),
    p('w-p24', '结尾', 'With the development of society, ____. Therefore, it is urgent and necessary to ____.', '随着社会发展……。因此，迫切需要……', '社会背景+建议'),
    p('w-p25', '结尾', 'For my part, I think it reasonable to ____. Only in this way can we ____.', '在我看来，……是合理的。只有这样，我们才能……', '个人观点+条件'),
    p('w-p26', '结尾', 'In my opinion, it is necessary to ____. The reasons are as follows. First, ____. Second, ____. Last but not least, ____.', '我认为有必要……。理由如下：第一……，第二……，最后……', '理由总结'),
    p('w-p27', '结尾', 'From what has been discussed above, we may reasonably arrive at the conclusion that ____.', '综上所述，我们可以合理得出结论：……', '结论句'),
    p('w-p28', '结尾', 'If we do not take effective measures, we may lose control of this trend and face unexpected consequences.', '如果我们不采取有效措施，就可能无法控制这一趋势，并面临意想不到的后果。', '反面警示'),
    p('w-p29', '结尾', 'It is high time that we took action to ____. Otherwise, ____.', '早该采取行动……。否则……', '虚拟语气呼吁'),
    p('w-p30', '结尾', 'Only by ____ can we ____ and build a more harmonious society.', '只有通过……，我们才能……并建设更和谐的社会。', 'Only 倒装结尾')
  ];

  var chunks = [
    v('w-v01', 'exert a profound influence on', '对……产生深远影响', '替换 have an effect on'),
    v('w-v02', 'lay a solid foundation for', '为……打下坚实基础', '常用于教育/成长'),
    v('w-v03', 'take concerted efforts', '共同努力', '替换 make joint efforts'),
    v('w-v04', 'raise public awareness of', '提高公众对……的意识', '环保/健康话题'),
    v('w-v05', 'weigh the pros and cons', '权衡利弊', '议论分析'),
    v('w-v06', 'in the long run', '从长远看', '结尾/分析'),
    v('w-v07', 'from a broader perspective', '从更广阔的视角', '替换 from another angle'),
    v('w-v08', 'attach due importance to', '充分重视', '替换 pay attention to'),
    v('w-v09', 'give priority to', '优先考虑', '措施建议'),
    v('w-v10', 'be conducive to', '有助于', '替换 be good for'),
    v('w-v11', 'foster a sense of responsibility', '培养责任感', '教育/青年'),
    v('w-v12', 'enhance the quality of life', '提升生活质量', '社会/科技'),
    v('w-v13', 'bridge the gap between', '弥合……之间的差距', '城乡/代际'),
    v('w-v14', 'keep pace with', '跟上……的步伐', '科技/时代'),
    v('w-v15', 'adapt to changing circumstances', '适应变化的环境', '个人/企业'),
    v('w-v16', 'tap the potential of', '挖掘……的潜力', '人才/技术'),
    v('w-v17', 'remove institutional barriers', '消除制度障碍', '社会改革'),
    v('w-v18', 'ensure equal access to', '确保平等获得……', '教育公平'),
    v('w-v19', 'strike a balance between', '在……之间取得平衡', '工作/生活'),
    v('w-v20', 'bear the consequences', '承担后果', '警示'),
    v('w-v21', 'a double-edged sword', '一把双刃剑', '科技/网络'),
    v('w-v22', 'an irreversible trend', '不可逆转的趋势', '全球化/数字化'),
    v('w-v23', 'at the expense of', '以……为代价', '批判性分析'),
    v('w-v24', 'in the face of', '面对', '替换 when facing'),
    v('w-v25', 'turn a blind eye to', '对……视而不见', '批评'),
    v('w-v26', 'take the initiative to', '主动去……', '建议/青年'),
    v('w-v27', 'be under increasing pressure', '面临越来越大的压力', '社会/学生'),
    v('w-v28', 'give full play to', '充分发挥', '能力/优势'),
    v('w-v29', 'come to terms with', '接受/妥协', '心理/变化'),
    v('w-v30', 'shed light on', '阐明/揭示', '研究/分析'),
    v('w-v31', 'a case in point', '恰当的例子', '举例'),
    v('w-v32', 'tell a different story', '情况截然不同', '对比'),
    v('w-v33', 'the tip of the iceberg', '冰山一角', '问题严重'),
    v('w-v34', 'a matter of urgency', '紧迫之事', '呼吁'),
    v('w-v35', 'in stark contrast', '形成鲜明对比', '图表/对比'),
    v('w-v36', 'beyond dispute', '毋庸置疑', '强调'),
    v('w-v37', 'gain increasing popularity', '越来越受欢迎', '现象'),
    v('w-v38', 'shoulder the responsibility', '承担责任', '社会'),
    v('w-v39', 'promote social harmony', '促进社会和谐', '结尾'),
    v('w-v40', 'achieve sustainable development', '实现可持续发展', '环保/经济')
  ];

  var templates = [
    {
      id: 'w-t01', track: 'writing', type: 'template', hot: true, name: '观点选择型', scene: '有人赞成、有人反对，最后表态',
      structure: ['引出争议', '对方观点+理由', '我方观点+理由', '总结表态'],
      frames: [
        'When it comes to ____, opinions vary from person to person.',
        'Some people argue that ____, mainly because ____.',
        'From my perspective, however, ____.',
        'Therefore, it is reasonable to conclude that ____.'
      ]
    },
    {
      id: 'w-t02', track: 'writing', type: 'template', hot: true, name: '现象分析型', scene: '描述现象、分析原因、提出对策',
      structure: ['描述现象', '分析原因', '说明影响', '提出建议'],
      frames: [
        'In recent years, ____ has become increasingly common.',
        'Several factors account for this phenomenon. First, ____. Second, ____.',
        'This trend has exerted a profound influence on ____.',
        'To address the issue, we should ____.'
      ]
    },
    {
      id: 'w-t03', track: 'writing', type: 'template', hot: true, name: '图表作文型', scene: '柱状图/折线图/饼图',
      structure: ['概述图表', '描述变化', '分析原因', '趋势判断'],
      frames: [
        'The chart clearly shows the changes in ____ over the past few years.',
        'As can be seen, ____ increased steadily, while ____ declined.',
        'This change can be attributed to ____.',
        'If this trend continues, ____.'
      ]
    },
    {
      id: 'w-t04', track: 'writing', type: 'template', hot: true, name: '图片作文型', scene: '漫画/照片寓意',
      structure: ['描述图片', '点明寓意', '分析论证', '总结升华'],
      frames: [
        'As is vividly depicted in the picture, ____.',
        'The picture conveys a clear message that ____.',
        'This is particularly true when ____.',
        'In conclusion, we should ____.'
      ]
    },
    {
      id: 'w-t05', track: 'writing', type: 'template', hot: true, name: '名言哲理型', scene: '谚语/名言引发的思考',
      structure: ['引出名言', '解释内涵', '举例论证', '联系自身'],
      frames: [
        'There is an old saying that ____.',
        'It reminds us that ____.',
        'Take ____ as an example. ____.',
        'From my own experience, I have come to realize that ____.'
      ]
    },
    {
      id: 'w-t06', track: 'writing', type: 'template', hot: true, name: '建议信', scene: '给学校/公司/政府提建议',
      structure: ['写信目的', '具体建议', '说明好处', '礼貌结尾'],
      frames: [
        'I am writing to offer some suggestions on ____.',
        'First, I suggest that ____. Second, ____.',
        'These measures would not only ____ but also ____.',
        'I would appreciate it if you could take my suggestions into consideration.'
      ]
    },
    {
      id: 'w-t07', track: 'writing', type: 'template', hot: true, name: '感谢/邀请信', scene: '活动邀请或感谢帮助',
      structure: ['表明身份/目的', '说明活动/感谢原因', '期待回应', '结尾'],
      frames: [
        'I am writing to invite you to ____ / to express my sincere gratitude for ____.',
        'The event will be held at ____ on ____.',
        'It would be a great pleasure if you could ____.',
        'I look forward to your reply.'
      ]
    },
    {
      id: 'w-t08', track: 'writing', type: 'template', hot: true, name: '求职/申请信', scene: '申请实习、志愿者或学生组织',
      structure: ['得知招聘', '说明匹配度', '表达意愿', '期待面试'],
      frames: [
        'I am writing to apply for the position of ____ advertised on ____.',
        'I believe I am qualified for this role because ____.',
        'I would welcome the opportunity to ____.',
        'Thank you for your time and consideration.'
      ]
    }
  ];

  var phrases = [
    ['with the booming of the economy', '随着经济的繁荣'],
    ['with the remarkable improvement of people\'s living standard', '随着人民生活水平的显著提高'],
    ['advanced science and technology', '先进的科学技术'],
    ['add spice to our daily life', '为日常生活增添情趣'],
    ['It is commonly believed that', '人们普遍认为'],
    ['arouse wide public concern', '引起广泛的公众关注'],
    ['It is undeniable that', '不可否认'],
    ['a heated discussion', '热烈的讨论'],
    ['a controversial issue', '有争议性的问题'],
    ['As far as I am concerned', '就我而言'],
    ['be supported by sound reasons', '有充分的理由支持'],
    ['play an increasingly important role in', '在……中发挥日益重要的作用'],
    ['be indispensable to', '对……必不可少'],
    ['As the proverb goes', '正如谚语所说'],
    ['exert positive effects on', '对……产生有利影响'],
    ['exert negative effects on', '对……产生不利影响'],
    ['The advantages far outweigh the disadvantages', '利远远大于弊'],
    ['give rise to', '导致/引起'],
    ['a complicated social phenomenon', '复杂的社会现象'],
    ['a sense of responsibility', '责任感'],
    ['a sense of competition and cooperation', '竞争与合作精神'],
    ['broaden one\'s vision', '开阔眼界'],
    ['acquire knowledge and skills', '学习知识和技能'],
    ['financial burden', '经济负担'],
    ['psychological burden', '心理负担'],
    ['take many factors into consideration', '考虑到诸多因素'],
    ['from another perspective', '从另一个角度'],
    ['make joint efforts', '做出共同努力'],
    ['be beneficial to', '对……有益'],
    ['make contributions to society', '为社会做贡献'],
    ['lay a solid foundation for', '为……打下坚实基础'],
    ['comprehensive quality', '综合素质'],
    ['be committed to', '致力于/投身于'],
    ['Admittedly', '应当承认'],
    ['satisfy the needs of', '满足……的需求'],
    ['a reliable source of information', '可靠的信息源'],
    ['valuable natural resources', '宝贵的自然资源'],
    ['convenient and efficient', '方便快捷'],
    ['in all aspects of human life', '在人类生活的方方面面'],
    ['environmentally friendly materials', '环保的材料'],
    ['a symbol of social progress', '社会进步的体现'],
    ['greatly facilitate people\'s lives', '大大方便人们的生活'],
    ['hold different attitudes towards this issue', '对这一问题持有不同态度'],
    ['to some extent', '在一定程度上'],
    ['attach great importance to', '高度重视']
  ].map(function (x, i) {
    return { id: 't-p' + String(i + 1).padStart(2, '0'), track: 'translation', type: 'phrase', hot: i < 20, part: '固定表达', en: x[0], zh: x[1], note: '', example: '' };
  });

  var tPatterns = [
    ['It is + adj. + that...', 'It is conceivable that knowledge plays an important part in our life.', '可想而知，知识在我们的生活中扮演着重要角色。', 'It is + 形容词 + that 从句'],
    ['It is + adj. + to do', 'It is necessary to raise public awareness of environmental protection.', '提高公众的环保意识是必要的。', 'It is + 形容词 + to do'],
    ['祈使句 + and/or', 'Work hard, and you will finally reach your goal.', '努力工作，你最终会实现目标。', '祈使句 + and/or + 结果'],
    ['as + many/much + as', 'Visitors spend only half as much money in a day in Leeds as in London.', '游客每天在利兹的花销仅为伦敦的一半。', '倍数/比较'],
    ['倍数 + as + adj. + as', 'The pool is three times as big as it was ten years ago.', '这个水池是十年前的三倍大。', '倍数表达'],
    ['no more...than', 'She is no more fit to be a manager than a schoolgirl would be.', '她和一个女学生一样不适合当经理。', '两者同样不'],
    ['Nothing is more...than', 'Nothing is more important than to receive education.', '没有比接受教育更重要的事。', '最高级强调'],
    ['without so much as', 'She left home without so much as looking back at him.', '她离开家，甚至没有回头看他一眼。', '甚至没有'],
    ['may/might as well', 'One may as well not know a thing at all as know it imperfectly.', '与其一知半解，还不如完全不知道。', '与其……不如……'],
    ['too...to', 'It was not too bright of them to settle in an area where earthquakes frequently occur.', '他们选择在地震多发地区定居，这并不明智。', '太……而不能'],
    ['only to find', 'He spent almost all his money on the hen, only to find it could not lay eggs.', '他几乎把所有的钱都花在那只鸡上，结果却发现它不会下蛋。', '结果却'],
    ['There is no doubt that', 'There is no doubt that war can be avoided if we get down to peace talks.', '毫无疑问，如果我们认真和谈，战争是可以避免的。', '毫无疑问'],
    ['rather than', 'Rather than pursue money, we should focus on self-improvement.', '我们应该注重自我提升，而不是追求金钱。', '而不是'],
    ['not...until', 'We cannot release the film until we have the approval of the authorities.', '直到获得当局批准，我们才能发行这部电影。', '直到……才'],
    ['so/such...that', 'They became so anxious that they could not sleep.', '他们焦虑得无法入睡。', '如此……以至于'],
    ['Chances are that', 'Chances are that she has already known it.', '她很可能已经知道了。', '很可能'],
    ['It occurred to sb. that', 'It never occurred to her that she would become a princess.', '她从未想到自己会成为王妃。', '突然想到'],
    ['not...but...', 'The plan caused not development but destruction.', '这个计划带来的不是发展，而是破坏。', '不是……而是……'],
    ['It is taken for granted that', 'It has been taken for granted that women should take on all the housework.', '人们一直理所当然地认为女性应承担所有家务。', '被认为理所当然'],
    ['When it comes to', 'When it comes to photography, I am not an expert.', '说到摄影，我不是专家。', '当提到……']
  ].map(function (x, i) {
    return { id: 't-s' + String(i + 1).padStart(2, '0'), track: 'translation', type: 'pattern', hot: true, part: '翻译句型', en: x[1], zh: x[2], note: x[0] + '：' + x[3], example: x[1] };
  });

  var vocab = words.slice(0, 80).map(function (w, i) {
    return { id: 't-v' + String(i + 1).padStart(3, '0'), track: 'translation', type: 'vocab', hot: (w.f || 0) >= 150, part: '高频词', en: w.w, zh: w.zh, note: w.note || '', example: '' };
  });

  var items = patterns.concat(chunks, templates, vocab, phrases, tPatterns);
  items.forEach(function (it, i) { it.seq = i; });

  D.cet6 = {
    meta: {
      title: '六级冲刺 · 高频考点',
      source: '整理自六级写作/翻译/阅读/听力资料',
      writingCount: patterns.length + chunks.length + templates.length,
      translationCount: vocab.length + phrases.length + tPatterns.length
    },
    items: items,
    writing: { patterns: patterns, chunks: chunks, templates: templates },
    translation: { vocab: vocab, phrases: phrases, patterns: tPatterns },
    tips: [
      '先背写作句型，再用模板搭框架，最后补高级词块。',
      '翻译先抓主干，再补修饰；遇到不会的词用上位词替换。',
      '每天的新卡量按目标日期自动计算，最后 3 天只复习。'
    ]
  };
})();