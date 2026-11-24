window.StudyHubData = window.StudyHubData || {};
StudyHubData.cet4Listening = {
  meta: { title: '四级听力 · 短对话练习', source: '按四级短对话场景整理', count: 4, note: '逐句 MP3，可倍速/重播，不依赖系统语音包' },
  sets: [
    {
      id: 'l01',
      title: 'Library Renewal',
      scene: '校园 · 图书馆',
      minutes: 3,
      script: [
        { role: 'M', text: "Hi, I'd like to renew these two books, please." },
        { role: 'W', text: "Sure. They're due today. You can renew them once for another two weeks." },
        { role: 'M', text: "Great. I also got an email about a fine." },
        { role: 'W', text: "Yes, one book was returned three days late. That's one dollar fifty." },
        { role: 'M', text: 'Can I pay by card?' },
        { role: 'W', text: 'Only cash at this desk, but you can pay online through your library account.' }
      ],
      questions: [
        {
          q: 'What does the man want to do?',
          options: ['Return two books.', 'Renew two books.', 'Pay a library fee.', 'Apply for a library card.'],
          answer: 1,
          explain: '男士开头说 renew these two books。'
        },
        {
          q: 'How can the man pay the fine?',
          options: ['By card at the desk.', 'By cash online.', 'Online through his account.', 'By asking a friend.'],
          answer: 2,
          explain: '女士说柜台只收现金，但可以在线通过账户支付。'
        }
      ]
    },
    {
      id: 'l02',
      title: 'Dinner for Two',
      scene: '生活 · 餐厅',
      minutes: 3,
      script: [
        { role: 'W', text: 'Good evening. Do you have a reservation?' },
        { role: 'M', text: "No, just a table for two, please." },
        { role: 'W', text: "I'm afraid the dining room is full, but we have a table on the terrace." },
        { role: 'M', text: "It's a bit cold out there. Could we sit near the heater?" },
        { role: 'W', text: 'Of course. And may I recommend today\'s special, mushroom soup?' },
        { role: 'M', text: "I'll have that. My friend is vegetarian, though." },
        { role: 'W', text: 'No problem. We have a vegetable pasta and a salad.' }
      ],
      questions: [
        {
          q: 'Where will the two speakers sit?',
          options: ['In the dining room.', 'Near the kitchen.', 'On the terrace near the heater.', 'At the bar.'],
          answer: 2,
          explain: '餐厅满了，女士建议露台；男士怕冷，要求靠近暖气。'
        },
        {
          q: 'What will the man\'s friend probably order?',
          options: ['Mushroom soup.', 'Vegetable pasta.', 'A steak.', 'Nothing.'],
          answer: 1,
          explain: '朋友是素食者，女士推荐了 vegetable pasta 和沙拉。'
        }
      ]
    },
    {
      id: 'l03',
      title: 'A Delayed Train',
      scene: '出行 · 车站',
      minutes: 3,
      script: [
        { role: 'M', text: 'Excuse me, is the nine forty train to Boston delayed?' },
        { role: 'W', text: 'Yes, by about twenty-five minutes. It will leave from platform six instead of platform four.' },
        { role: 'M', text: 'Do I need a new ticket because of the platform change?' },
        { role: 'W', text: 'No, your ticket is still valid. Just go to platform six.' },
        { role: 'M', text: 'Is there a place to get coffee nearby?' },
        { role: 'W', text: 'The cafe by the main gate is open. You have plenty of time.' }
      ],
      questions: [
        {
          q: 'Which platform should the man go to?',
          options: ['Platform 4.', 'Platform 6.', 'Platform 9.', 'Platform 25.'],
          answer: 1,
          explain: '女士说改到 6 号站台。'
        },
        {
          q: 'What does the woman say about the ticket?',
          options: ['It must be changed.', 'It is still valid.', 'It should be refunded.', 'It costs extra.'],
          answer: 1,
          explain: '女士明确说 ticket is still valid。'
        }
      ]
    },
    {
      id: 'l04',
      title: 'An Internship Interview',
      scene: '职场 · 面试',
      minutes: 3,
      script: [
        { role: 'W', text: 'Thanks for coming. You applied for the marketing internship, right?' },
        { role: 'M', text: "Yes. I'm a third-year student majoring in business." },
        { role: 'W', text: 'The internship is three days a week. Would that fit your class schedule?' },
        { role: 'M', text: 'I have classes on Monday and Wednesday, so Tuesday, Thursday and Friday work for me.' },
        { role: 'W', text: 'Good. After the first month of training, we also allow some remote work.' },
        { role: 'M', text: "That would be really helpful. I'd love to join the team." }
      ],
      questions: [
        {
          q: 'Which days can the man work?',
          options: ['Monday and Wednesday.', 'Tuesday, Thursday and Friday.', 'Every weekday.', 'Only at weekends.'],
          answer: 1,
          explain: '男士周一、周三有课，所以周二、周四、周五可以。'
        },
        {
          q: 'What does the company offer after training?',
          options: ['A higher salary.', 'Free lunch.', 'Some remote work.', 'A longer holiday.'],
          answer: 2,
          explain: '女士说培训一个月后允许部分远程工作。'
        }
      ]
    }
  ]
};