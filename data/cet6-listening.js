window.StudyHubData = window.StudyHubData || {};
StudyHubData.cet6Listening = {
  meta: { title: '六级听力 · 短对话练习', source: '按六级短对话场景整理', count: 4, note: '逐句 MP3，可倍速/重播，不依赖系统语音包' },
  sets: [
    {
      id: 'l01',
      title: 'Asking for an Extension',
      scene: '校园 · 论文延期',
      minutes: 3,
      script: [
        { role: 'M', text: 'Professor Lee, could I talk to you about the research paper?' },
        { role: 'W', text: 'Of course. The deadline is Friday, isn\'t it?' },
        { role: 'M', text: 'Yes, but my laptop crashed last weekend and I lost two days of work.' },
        { role: 'W', text: 'Do you have a backup? I always tell students to save drafts in the cloud.' },
        { role: 'M', text: 'I have an old version, but the latest analysis is gone.' },
        { role: 'W', text: 'I can give you until Tuesday, but you will lose five points for lateness.' },
        { role: 'M', text: 'That\'s fair. I\'ll also bring the old draft to show my progress.' }
      ],
      questions: [
        {
          q: 'Why does the man ask for an extension?',
          options: ['He was ill for a week.', 'He lost work when his laptop crashed.', 'He forgot the deadline.', 'He needs to borrow a book.'],
          answer: 1,
          explain: '男士说电脑崩溃，丢了两天的工作。'
        },
        {
          q: 'What will happen if the man submits on Tuesday?',
          options: ['He will receive no grade.', 'He will lose five points.', 'He will get extra credit.', 'He will have to rewrite the paper.'],
          answer: 1,
          explain: '教授说可以延到周二，但迟交扣五分。'
        }
      ]
    },
    {
      id: 'l02',
      title: 'A Remote Internship',
      scene: '求职 · 远程实习',
      minutes: 3,
      script: [
        { role: 'W', text: 'Thanks for coming in. Your application says you are interested in a remote internship.' },
        { role: 'M', text: 'Yes. I worked remotely for a student magazine last summer and enjoyed it.' },
        { role: 'W', text: 'How did you stay in touch with the team?' },
        { role: 'M', text: 'We had a short video meeting every morning and used a shared document for tasks.' },
        { role: 'W', text: 'That sounds organized. This role requires about fifteen hours a week.' },
        { role: 'M', text: 'I can manage that around my classes, as long as the meetings are in the afternoon.' },
        { role: 'W', text: 'Most of them are. We will make a decision by next Wednesday.' }
      ],
      questions: [
        {
          q: 'What is the man applying for?',
          options: ['A full-time job in an office.', 'A remote internship.', 'A position at a student magazine.', 'A teaching assistant role.'],
          answer: 1,
          explain: '女士开头提到 remote internship。'
        },
        {
          q: 'What does the man need in order to accept the role?',
          options: ['A higher salary.', 'Afternoon meetings.', 'A new laptop.', 'More holiday time.'],
          answer: 1,
          explain: '男士说只要会议在下午，就能兼顾课程。'
        }
      ]
    },
    {
      id: 'l03',
      title: 'A Delayed Train',
      scene: '交通 · 火车晚点',
      minutes: 3,
      script: [
        { role: 'W', text: 'Excuse me, is this the platform for the 9:40 train to Edinburgh?' },
        { role: 'M', text: 'It was, but the train is delayed by about forty minutes.' },
        { role: 'W', text: 'I have a meeting at eleven. Is there another service?' },
        { role: 'M', text: 'There is one at 10:05, but it stops at every station and arrives later.' },
        { role: 'W', text: 'Then I will stay with this one. Can I get a refund if it is cancelled?' },
        { role: 'M', text: 'Yes, keep your ticket and claim it online. You can also take the bus if the delay is over an hour.' }
      ],
      questions: [
        {
          q: 'How long is the train delayed?',
          options: ['About fifteen minutes.', 'About forty minutes.', 'About an hour.', 'About two hours.'],
          answer: 1,
          explain: '工作人员说晚点约四十分钟。'
        },
        {
          q: 'Why does the woman decide to wait for the original train?',
          options: ['The other train is more expensive.', 'The other train stops at every station and arrives later.', 'She has already missed her meeting.', 'The bus is not running.'],
          answer: 1,
          explain: '10:05 的车每站都停，到得更晚，所以她等原来那班。'
        }
      ]
    },
    {
      id: 'l04',
      title: 'A Campus Sustainability Project',
      scene: '校园 · 环保项目',
      minutes: 3,
      script: [
        { role: 'M', text: 'Our group needs to finish the proposal for the campus waste project by Friday.' },
        { role: 'W', text: 'I have the survey results. Most students say they would use separate bins if they were closer.' },
        { role: 'M', text: 'So the problem is convenience, not awareness.' },
        { role: 'W', text: 'Exactly. We could suggest placing bins near every dorm entrance.' },
        { role: 'M', text: 'Good. I will write the budget section. Can you make the charts?' },
        { role: 'W', text: 'Sure, but I need the numbers by Wednesday evening.' },
        { role: 'M', text: 'I will send them tonight.' }
      ],
      questions: [
        {
          q: 'What is the main problem found in the survey?',
          options: ['Students do not know how to recycle.', 'Bins are not convenient enough.', 'The project has no budget.', 'Dormitories produce no waste.'],
          answer: 1,
          explain: '学生说如果分类垃圾桶更近就会使用，问题是便利性。'
        },
        {
          q: 'What will the woman do?',
          options: ['Write the budget section.', 'Make the charts.', 'Conduct another survey.', 'Send the numbers tonight.'],
          answer: 1,
          explain: '男士写预算，请女士做图表。'
        }
      ]
    }
  ]
};