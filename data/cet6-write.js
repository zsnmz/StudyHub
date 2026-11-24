window.StudyHubData = window.StudyHubData || {};
StudyHubData.cet6Write = {
  meta: { title: '六级写译 · 键盘作答', source: '按六级写作/翻译题型整理', writingCount: 4, translationCount: 4 },
  writing: [
    {
      id: 'w01',
      title: 'The Value of Failure',
      type: '议论文 · 哲理',
      minutes: 30,
      direction: 'Write an essay on the value of failure. You should explain why failure can be useful and give an example. Write at least 150 words but no more than 200 words.',
      model: `Failure is usually treated as something to be avoided, yet it is often the beginning of real learning. When everything goes smoothly, we rarely examine our assumptions. A failed experiment, a rejected application or a poor presentation forces us to ask what went wrong and what we might do differently. This process builds resilience and judgment, qualities that success alone cannot teach.

Thomas Edison famously tested thousands of materials before finding a suitable filament for the light bulb. Each failed attempt narrowed the search and provided information. In the same way, a student who fails an exam can learn how to study more effectively, provided that he or she is willing to reflect rather than give up.

The value of failure, however, depends on how we respond to it. If we hide it or blame others, it remains only a setback. If we treat it as feedback, it becomes a stepping stone. In this sense, the most important lesson is not how to avoid failure, but how to learn from it.`,
      tips: ['开头对比 failure 与 learning', '主体用 Edison 例子 + 学生例子', '结尾落到 how to respond / feedback']
    },
    {
      id: 'w02',
      title: 'Privacy in the Digital Age',
      type: '议论文 · 科技',
      minutes: 30,
      direction: 'Write an essay about the challenges to personal privacy in the digital age. Discuss what individuals and companies should do. Write at least 150 words but no more than 200 words.',
      model: `Digital technology has made life more convenient, but it has also made privacy harder to protect. Every search, purchase and location check leaves a trace. Companies collect this data to predict behavior and target advertising, while weak security can expose users to fraud. The result is a sense of being watched without knowing exactly by whom.

Individuals can take practical steps: use strong passwords, limit the information they share and read privacy settings. Yet personal caution is not enough. Companies should collect only what they need, store it securely and explain clearly how it is used. Governments should also set rules and punish serious violations.

Privacy is not a luxury for people with something to hide; it is a condition of free and dignified life. A society that treats personal data as a free resource will eventually damage trust. The goal should be to enjoy the benefits of technology without surrendering control over our own information.`,
      tips: ['问题—个人—企业/政府—观点四层', '用 collect/store/explain 具体化企业责任', '结尾用 not a luxury...but a condition']
    },
    {
      id: 'w03',
      title: 'A Proposal for a Low-Carbon Campus',
      type: '应用文 · 建议信',
      minutes: 30,
      direction: 'Write a proposal to your university about how to make the campus more environmentally friendly. Describe two or three specific measures and explain their benefits. Write at least 150 words but no more than 200 words.',
      model: `Dear President,

I am writing to propose several measures to make our campus more environmentally friendly. Although the university has improved waste sorting, there is still much that can be done.

First, I suggest installing water-saving taps and more efficient lighting in teaching buildings. These changes would reduce both water and electricity consumption, and the savings could be used to support student activities. Second, the university could introduce a shared bicycle system and improve bus routes between campuses. This would encourage students to leave their cars and motorbikes at home. Third, a repair corner could be set up in each dormitory, where broken appliances and furniture are fixed instead of thrown away.

These measures are practical and relatively inexpensive. More importantly, they would turn sustainability from a slogan into a daily habit. I hope the university will consider them.

Yours sincerely,
Li Ming`,
      tips: ['称呼 + 写信目的 + 2–3 条具体措施 + 呼吁', '每条措施写清做法和好处', '建议信用 First/Second/Third 结构清晰']
    },
    {
      id: 'w04',
      title: 'Automation and the Future of Work',
      type: '议论文 · 社会',
      minutes: 30,
      direction: 'Write an essay about how automation may affect employment. Discuss both opportunities and risks, and give your own view. Write at least 150 words but no more than 200 words.',
      model: `Automation is changing the workplace faster than many people expected. Robots and software can perform repetitive tasks with speed and accuracy, which raises productivity and lowers costs. In hospitals, factories and offices, machines already handle work that was once done by hand. For workers, this can mean safer jobs and more time for creative tasks.

The risks, however, are serious. Jobs based on routine tasks may disappear, and the workers affected are often those with the least training. New jobs may be created, but they often require skills that older employees do not have. Without support, automation could widen inequality.

In my view, the answer is not to resist technology but to manage its effects. Governments should fund retraining and strengthen social protection. Companies should involve workers in designing new roles. Individuals should treat learning as a lifelong habit. Automation can create a better future, but only if its benefits are shared.`,
      tips: ['opportunities / risks / own view 三段', '用 may / could 保持客观', '结尾条件句 only if benefits are shared']
    }
  ],
  translation: [
    {
      id: 't01',
      title: '中国传统建筑',
      topic: '传统文化 · 建筑',
      minutes: 15,
      zh: '中国传统建筑注重与自然和谐相处。北方的四合院以庭院为中心，房屋围绕庭院布局，体现家族观念。南方的园林则强调借景和曲折变化，使人每走一步都能看到不同的景色。传统建筑多使用木材，屋顶常采用飞檐设计，既美观又利于排水。故宫是中国传统建筑的代表，其对称布局和黄色琉璃瓦象征皇权。如今，许多古城和村落被保护起来，传统建筑技艺也被列入非物质文化遗产。',
      model: `Traditional Chinese architecture emphasizes harmony with nature. In the north, the siheyuan is centered on a courtyard, with houses arranged around it, reflecting the importance of the extended family. Gardens in the south stress borrowed scenery and winding paths, so that every step reveals a different view. Most traditional buildings use wood, and their roofs often feature upturned eaves, which are both elegant and useful for drainage. The Forbidden City is a representative of traditional Chinese architecture, whose symmetrical layout and yellow glazed tiles symbolized imperial power. Today, many ancient cities and villages are protected, and traditional building techniques have been included in the intangible cultural heritage list.`,
      tips: ['四合院 siheyuan；庭院 courtyard；飞檐 upturned eaves', '借景 borrowed scenery；对称布局 symmetrical layout', '被列入 be included in the intangible cultural heritage list']
    },
    {
      id: 't02',
      title: '中国5G技术',
      topic: '科技 · 通信',
      minutes: 15,
      zh: '中国在5G技术领域处于世界前列。5G网络具有高速率、低延迟和大连接的特点，为远程医疗、自动驾驶和智能制造提供了可能。近年来，中国建成了大量5G基站，覆盖了城市和部分农村地区。5G不仅改变了人们的通信方式，也推动了数字经济的发展。例如，农民可以通过网络直播销售农产品，医生可以为偏远地区的患者提供远程诊断。当然，5G的普及也带来了网络安全和隐私保护的新挑战。',
      model: `China is at the forefront of 5G technology. 5G networks feature high speed, low latency and massive connectivity, making possible remote healthcare, autonomous driving and smart manufacturing. In recent years, China has built a large number of 5G base stations, covering cities and some rural areas. 5G has not only changed the way people communicate but also boosted the digital economy. For example, farmers can sell agricultural products through live streaming, and doctors can provide remote diagnosis for patients in remote areas. Of course, the spread of 5G has also brought new challenges to cybersecurity and privacy protection.`,
      tips: ['处于前列 be at the forefront of', '高速率/低延迟/大连接 high speed, low latency, massive connectivity', '直播销售 live streaming；远程诊断 remote diagnosis']
    },
    {
      id: 't03',
      title: '中国高等教育',
      topic: '教育 · 社会',
      minutes: 15,
      zh: '改革开放以来，中国高等教育取得了显著成就。高校数量和学生人数大幅增加，越来越多的年轻人有机会进入大学学习。中国政府实施了一系列政策，支持中西部高校发展，促进教育公平。与此同时，高校更加重视培养学生的创新能力和实践能力，鼓励学生参与科研和社会服务。近年来，来华留学生数量不断增长，中国高校的国际影响力也在提升。不过，如何提高教育质量、缓解就业压力，仍是需要面对的问题。',
      model: `Since the reform and opening-up, China's higher education has made remarkable achievements. The number of universities and students has increased substantially, and more young people have the opportunity to attend university. The Chinese government has implemented a series of policies to support universities in the central and western regions and promote educational equity. At the same time, universities are paying more attention to cultivating students' creativity and practical skills, and encouraging them to take part in research and social service. In recent years, the number of international students in China has continued to grow, and the global influence of Chinese universities has been rising. However, how to improve the quality of education and ease employment pressure remains a challenge.`,
      tips: ['改革开放 reform and opening-up；显著成就 remarkable achievements', '教育公平 educational equity；创新能力 creativity', '缓解就业压力 ease employment pressure']
    },
    {
      id: 't04',
      title: '乡村振兴',
      topic: '社会 · 发展',
      minutes: 15,
      zh: '乡村振兴是中国的一项重要战略。过去，许多农村地区面临基础设施落后、年轻人外流等问题。近年来，政府加大了对农村道路、水电和网络的投入，改善了农民的生活条件。各地还根据自身特点发展特色产业，如有机农业、乡村旅游和手工艺品制作。一些年轻人选择返乡创业，为乡村带来了新的活力。乡村振兴不仅是经济发展问题，也关系到文化传承和生态保护。',
      model: `Rural revitalization is an important strategy in China. In the past, many rural areas suffered from poor infrastructure and the outflow of young people. In recent years, the government has increased investment in rural roads, water, electricity and internet access, improving farmers' living conditions. Localities have also developed industries suited to their own features, such as organic farming, rural tourism and handicrafts. Some young people have chosen to return home to start businesses, bringing new vitality to the countryside. Rural revitalization is not only a matter of economic development but also concerns cultural inheritance and ecological protection.`,
      tips: ['乡村振兴 rural revitalization；基础设施 infrastructure', '特色产业 industries suited to local features；返乡创业 return home to start businesses', '文化传承 cultural inheritance；生态保护 ecological protection']
    }
  ]
};