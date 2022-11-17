"use strict"
class Reply {
    // A dialogue response option
    constructor(replyMsg, topicNameLink, selectEffects, isActive) {
        // args: (String | Function, String | Function, Function | None, Function | None)
        this.replyMsg = replyMsg;
        this.topicNameLink = topicNameLink;
        const defaultSelectEffects = () => {};
        this.selectEffects = selectEffects || defaultSelectEffects;
        const defaultIsActive = () => true;
        this.isActive = isActive || defaultIsActive;
        this.onClickEffect = (speaker) => {
            this.selectEffects(speaker);
            if(typeof this.topicNameLink === "function")
                speaker.initiateDialogue(topicNameLink(speaker));
            else if(topicNameLink)
                speaker.initiateDialogue(topicNameLink);
            else 
                speaker.goodbye();
        }
    }
}

class Topic {
    // Container for npc messages and player replies
    constructor(speakerMsg, replies) {
        // args: (String | Npc => String, Reply[] | Npc => Reply[])
        this.speakerMsg = speakerMsg;
        this.replies = replies;
    }
    getSpeakerMsg(speaker) {
        if(typeof this.speakerMsg == "function")
            return this.speakerMsg(speaker);
        else
            return this.speakerMsg;
    }
    setSpeakerMsg(speakerMsg) {
        this.speakerMsg = speakerMsg;
    }
    addReply(reply) {
        this.replies.push(reply);
    }
    clone() {
        return new Topic(this.speakerMsg, this.replies);
    }
}

class Quest {
    constructor(id, name, dialogue, canStart, isCompleted, isFailed, startEffects, completeEffects) {
        //params: (String, String, String{}, boolFunc, boolFunc, boolFunc, func, func)
        this.id = id;
        this.name = name;
        this.dialogue = {
            request: dialogue.request || ("I need some help with " + this.name + "."),
            description: dialogue.description || ("I would like you to complete my quest, " + this.name + "."),
            accept: dialogue.accept || "Thanks!",
            reject: dialogue.reject || "Oh, sorry to hear. Come back if you change your mind.",
            update: dialogue.update || "How is it going?",
            reminder: dialogue.reminder || ("Well if you will remember, I asked you to help with my quest, " + this.name + "."),
            completed: dialogue.completed || "Oh thank you so much for helping me!",
            failed: dialogue.failed || "It looks like you failed to do as I asked..."
        };
        this.canStart = canStart;
        this.isCompleted = isCompleted;
        this.isFailed = isFailed;
        function fDef() {};
        this.startEffects = startEffects || fDef;
        this.completeEffects = completeEffects || fDef;
        this.started = false;
        this.completed = false;
        this.failed = false;
    }
}


class TopicGenerator {
    // Class for automatically creating dialogue tree for NPCs
    // It contains default dialogue options, but can be modified to
    // fit individual NPCs.
    constructor(people, quests) {
        this.people = people || [];
        this.quests = quests || [];
        this.general = {
            // General dialogue
            greetings: {
                good: "Greetings, friend! What brings you here today?",
                neutral: "Hello. Can I help you?",
                bad: "Oh... you again. What do you want?"
            },
            pOutro: "I must be going now.",
            npcBye: "Well goodbye then.",
            pBye: "Goodbye."
        };
        this.newTopic = {
            // New topic transitions
            pStart: "Let's talk about something else.",
            npcStart: "What would you like to talk about?",
            pCancel: "I should leave."
        };
        this.smallTalk = {
            // Small talk chat, such as compliments and insults
            pStart: "I just want to chat.",
            npcStart: "What would you like to say?",
            list: [
                // {id, str, value}
            ],
            npcResponses: {
                great: "Oh wow! Thank you!",
                good: "That's a nice thing to say.",
                neutral: "If you say so.",
                bad: "I don't appreciate you saying that.",
                terrible: "I really hate that."
            },
            pRetry: "I have more to say.",
            pCancel: "Actually nevermind.",
            npcFailResponse: "I don't feel like it right now."
        };
        this.info = {
            // Informational questions
            pStart: "I would like to ask a question.",
            npcStart: "What's your question?",
            list: [
                // {id, str, respId, respStr}
            ],
            pRetry: "Can I ask you another question?",
            npcFailResponse: "I don't think I can help you."
        };
        this.gossip = {
            // Player opinions on other NPCs
            pStart: "How about we talk about a person?",
            npcStart: "Alright, who?",
            pTransition: "$NAME.",
            npcTransition: "Very well. What do you think about $NAME?",
            pOpinions: {
                great: "I think $PRONOUN is amazing!",
                good: "I think $PRONOUN seems pretty nice.",
                //neutral: "I think $PRONOUN is mostly average.",
                bad: "I think $PRONOUN isn't very nice.",
                terrible: "I think $PRONOUN is an awful person."
            },
            npcReactions: {
                agree: "I agree with you there.",
                neutral: "Thanks for letting me know.",
                disagree: "I'm afraid I have to disagree"
            },
            pRetry: "Well let me tell you about someone else.",
            pCancel: "Actually nevermind.",
            pGetJudgement: "So what do you think about $NAME?",
            pGetJudgementQuick: "I just wanted to know your opinion.",
            npcTired: "I think we have talked enough about $NAME for now.",
            npcFailResponse: "I'm not really interested in gossip."
        };
        this.judgement = {
            // NPC opinions on other npcs
            pStart: "I would like your opinion on somebody.",
            npcStart: "Who would you like to know more about?",
            pTransition: "$NAME.",
            npcGeneralOpinions: {
                great: "In my opinion, $PRONOUN is great.",
                good: "In my opinion, $PRONOUN is decent enough.",
                neutral: "I don't really have an opinion.",
                bad: "In my opinion, $PRONOUN is not very nice.",
                terrible: "In my opinion, $PRONOUN is horrible."
            },
            npcSpecificOpinions: {
                //name: {great, good, neutral, bad, terrible, default}
            },
            pRetry: "Let's talk about someone else.",
            pTellGossip: "Oh really? Let me tell you what I think...",
            npcFailResponse: "I don't feel like we should be talking about this."
        };
        this.questDialogue = {
            pStart: "Do you need help with anything?",
            npcListIntro: "Actually, yes...",
            npcListFail: "No, I'm good right now.",
            pAccept: "I can do that!",
            pRefuse: "Sorry, I don't have time to do that right now.",
            pUpdateIntro: "I would like to discuss a task you gave me.",
            npcUpdateIntro: "Which task?",
            pRemind: "Can you remind me what I'm supposed to be doing?",
            pComplete: "I have done what you asked me.",
            pNewQuest: "Is there anything else I can help you with?",
            npcFailResponse: "I don't need your help."
        };
        this.extraBranches = [];
    }
    addSmallTalk(id, str, value) {
        const used = false;
        this.smallTalk.list.push({id, str, value, used});
    }
    addInfo(id, str, respId, respStr, selectEffects, isActive) {
        this.info.list.push({id, str, respId, respStr, selectEffects, isActive});
    }
    addTopicBranch(pStart, branchName) {
        this.extraBranches.push({pStart, branchName});
    }
    generate() {
        // Main method for generating topics

        function personReplace(str, person) {
            // Helper function for replacing name and pronoun tokens with actual names or pronouns
            return str.replace("$NAME", person.name).replace("$PRONOUN", person.pronoun);
        }

        // Static topic list
        const topics = {
            // General:
            greet: new Topic(speaker => {
                if(speaker.opinions.player > 20)
                    return this.general.greetings.good;
                else if(speaker.opinions.player < -20)
                    return this.general.greetings.bad;
                else
                    return this.general.greetings.neutral;
            }, [
                new Reply(this.smallTalk.pStart, "smallTalkList", null, () => this.smallTalk.list.some(st => !st.used)),
                new Reply(this.info.pStart, "infoList"),
                new Reply(this.gossip.pStart, "gossipList", null, () => level.players[0].npcsMet.length > 1),
                new Reply(this.questDialogue.pStart, "questList"),
                new Reply(this.questDialogue.pUpdateIntro, "questUpdates", null, speaker => speaker.quests.some(qst => qst.started && !qst.completed)),
            ].concat(this.extraBranches.map(props => new Reply(props.pStart, props.branchName))).concat(new Reply(this.newTopic.pCancel, "goodbye"))),
            newTopic: new Topic(this.newTopic.npcStart, [
                new Reply(this.smallTalk.pStart, "smallTalkList", null, () => this.smallTalk.list.some(st => !st.used)),
                new Reply(this.info.pStart, "infoList"),
                new Reply(this.gossip.pStart, "gossipList", null, () => level.players[0].npcsMet.length > 1),
                new Reply(this.questDialogue.pStart, "questList"),
                new Reply(this.questDialogue.pUpdateIntro, "questUpdates", null, speaker => speaker.quests.some(qst => qst.started && !qst.completed))
            ].concat(this.extraBranches.map(props => new Reply(props.pStart, props.branchName))).concat(new Reply(this.newTopic.pCancel, "goodbye"))),
            goodbye: new Topic(this.general.npcBye, [
                new Reply(this.general.pBye)
            ]),
            // Small talk:
            smallTalkList: new Topic(this.smallTalk.npcStart, this.smallTalk.list.map(st => {
                let responseType;
                if(st.value >= 10)                  responseType = "smallTalkGreat";
                if(st.value < 10 && st.value > 0)   responseType = "smallTalkGood";
                if(st.value === 0)                  responseType = "smallTalkNeutral";
                if(st.value < 0 && st.value > -10)  responseType = "smallTalkBad";
                if(st.value <= -10)                 responseType = "smallTalkTerrible";
                return new Reply(st.str, responseType, speaker => {
                    speaker.modOpinion("player", st.value);
                    st.used = true;
                }, () => !st.used);
            }).concat(new Reply(this.smallTalk.pCancel, "newTopic"))),
            smallTalkGreat: new Topic(this.smallTalk.npcResponses.great, [
                new Reply(this.smallTalk.pRetry, "smallTalkList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]),
            smallTalkGood: new Topic(this.smallTalk.npcResponses.good, [
                new Reply(this.smallTalk.pRetry, "smallTalkList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]),
            smallTalkNeutral: new Topic(this.smallTalk.npcResponses.neutral, [
                new Reply(this.smallTalk.pRetry, "smallTalkList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]),
            smallTalkBad: new Topic(this.smallTalk.npcResponses.bad, [
                new Reply(this.smallTalk.pRetry, "smallTalkList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]),
            smallTalkTerrible: new Topic(this.smallTalk.npcResponses.terrible, [
                new Reply(this.smallTalk.pRetry, "smallTalkList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]),
            // Info:
            infoList: new Topic(this.info.npcStart, this.info.list.map(infoEntry => {
                return new Reply(infoEntry.str, infoEntry.respId, infoEntry.selectEffects, infoEntry.isActive);
            })),
            // Gossip:
            gossipList: new Topic(this.gossip.npcStart, this.people.map(person => {
                return new Reply(personReplace(this.gossip.pTransition, person), "gossip-" + person.name, null, () => level.players[0].npcsMet.includes(person.name));
            }).concat(new Reply(this.gossip.pCancel, "newTopic"))),
            questList: new Topic(() => {
                const startableQuests = this.quests.filter(qst => qst.canStart() && !qst.started);
                if(startableQuests.length > 0) {
                    const questRequests = startableQuests.map(qst => qst.dialogue.request);
                    const questString = questRequests.join("<br>");
                    return this.questDialogue.npcListIntro + "\n" + questString;
                }
                else {
                    return this.questDialogue.npcListFail;
                }
            }, () => {
                const startableQuests = this.quests.filter(qst => qst.canStart() && !qst.started);
                if(startableQuests.length > 0) {
                    return startableQuests.map(qst => new Reply("Tell me more about " + qst.name + ".", "questStart-" + qst.id));
                }
                else {
                    return [
                        new Reply(this.newTopic.pStart, "newTopic"),
                        new Reply(this.general.pOutro, "goodbye")
                    ];
                }
            }),
            questUpdates: new Topic(this.questDialogue.npcUpdateIntro, () => {
                return this.quests.filter(qst => qst.started && !qst.completed).map(qst => new Reply(qst.name + ".", "questUpdate-" + qst.id));
            })
        };

        // Dynamically generated topics
        // Info:
        this.info.list.forEach(infoEntry => {
            if(infoEntry.respStr) {
                topics[infoEntry.respId] = new Topic(infoEntry.respStr, [
                    new Reply(this.info.pRetry, "infoList"),
                    new Reply(this.newTopic.pStart, "newTopic"),
                    new Reply(this.general.pOutro, "goodbye")
                ]);
            }
        });
        // Gossip:
        this.people.forEach(person => {
            const createGossipReplies = (pOpinions) => {
                const results = [];
                for(let gossipLevel in pOpinions) {
                    const gossipStr = pOpinions[gossipLevel];
                    let gossipValue;
                    switch(gossipLevel) {
                        case "great":
                            gossipValue = 50;
                            break;
                        case "good":
                            gossipValue = 5;
                            break;
                        case "neutral":
                            gossipValue = 0;
                            break;
                        case "bad":
                            gossipValue = -5;
                            break;
                        case "terrible":
                            gossipValue = -50;
                            break;
                    }
                    results.push(new Reply(personReplace(gossipStr, person), "gossip-" + person.name + "-" + gossipLevel, speaker => {
                        const trust = speaker.getOpinion("player");
                        const baseChange = trust*gossipValue;
                        let finalChange = 0;
                        if(baseChange > 1)
                            finalChange = Math.floor(Math.log(baseChange));
                        if(baseChange < -1)
                            finalChange = -Math.floor(Math.log(Math.abs(baseChange)));
                        speaker.modOpinion(person.name, finalChange);
                        speaker.addRecentGossip(person.name);
                    }));
                }
                results.push(new Reply(this.gossip.pGetJudgementQuick, () => "judgement-" + person.name));
                return results;
            }
            topics["gossip-" + person.name] = new Topic(speaker => {
                if(speaker.willGossip(person.name))
                    return personReplace(this.gossip.npcTransition, person);
                else
                    return personReplace(this.gossip.npcTired, person);
            }, speaker => {
                if(speaker.willGossip(person.name))
                    return createGossipReplies(this.gossip.pOpinions)
                else
                    return [
                        new Reply(this.gossip.pGetJudgementQuick, () => "judgement-" + person.name),
                        new Reply(this.gossip.pRetry, "gossipList"),
                        new Reply(this.newTopic.pStart, "newTopic"),
                        new Reply(this.general.pOutro, "goodbye")
                    ];
            });
            for(let gossipLevel in this.gossip.pOpinions) {
                topics["gossip-" + person.name + "-" + gossipLevel] = new Topic(speaker => {
                    let agreementLevel = "neutral";
                    const opinionThreshold = 10;
                    const opinion = speaker.getOpinion(person.name);
                    if(gossipLevel === "great" || gossipLevel === "good") {
                        if(opinion >= opinionThreshold)
                            agreementLevel = "agree";
                        else if(opinion <= -opinionThreshold)
                            agreementLevel = "disagree";
                    }
                    else if(gossipLevel === "bad" || gossipLevel === "terrible") {
                        if(opinion >= opinionThreshold)
                            agreementLevel = "disagree";
                        else if(opinion <= -opinionThreshold)
                            agreementLevel = "agree";
                    }
                    return this.gossip.npcReactions[agreementLevel];
                }, [
                    new Reply(personReplace(this.gossip.pGetJudgement, person), () => "judgement-" + person.name),
                    new Reply(this.gossip.pRetry, "gossipList"),
                    new Reply(this.newTopic.pStart, "newTopic"),
                    new Reply(this.general.pOutro, "goodbye")
                ]);
            }
        });
        // Judgement:
        this.people.forEach(person => {
            topics["judgement-" + person.name] = new Topic(speaker => {
                let judgementLevel = "";
                const opinionValue = speaker.getOpinion(person.name);
                if(opinionValue >= 20)
                    judgementLevel = "great";
                else if(opinionValue >= 10)
                    judgementLevel = "good";
                else if(opinionValue >= -10)
                    judgementLevel = "neutral";
                else if(opinionValue >= -20)
                    judgementLevel = "bad";
                else if(opinionValue < -20)
                    judgementLevel = "terrible";
                else
                    judgementLevel = "neutral";
                
                let respStr = this.judgement.npcGeneralOpinions[judgementLevel];
                if(this.judgement.npcSpecificOpinions[person] != undefined) {
                    if(this.judgement.npcSpecificOpinions[judgementLevel] != undefined)
                        respStr = this.judgement.npcSpecificOpinions[judgementLevel];
                    else if(this.judgement.npcSpecificOpinions.default != undefined)
                        respStr = this.judgement.npcSpecificOpinions[judgementLevel];
                }
                return personReplace(respStr, person);
            }, [
                new Reply(this.judgement.pRetry, "gossipList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]);
        });
        //Quests
        this.quests.forEach(quest => {
            topics["questStart-" + quest.id] = new Topic(quest.dialogue.description, [
                new Reply(this.questDialogue.pAccept, "questAccept-" + quest.id, () => {
                    quest.started = true;
                    quest.startEffects();
                }),
                new Reply(this.questDialogue.pRefuse, "questRefuse-" + quest.id)
            ]);
            topics["questAccept-" + quest.id] = new Topic(quest.dialogue.accept, [
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]);
            topics["questUpdate-" + quest.id] = new Topic(quest.dialogue.update, [
                new Reply(this.questDialogue.pRemind, "questRemind-" + quest.id),
                new Reply(this.questDialogue.pComplete, "questComplete-" + quest.id, () => {
                    quest.completed = true;
                    quest.completeEffects();
                }, () => quest.isCompleted())
            ]);
            topics["questRemind-" + quest.id] = new Topic(quest.dialogue.reminder, [
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]);
            topics["questComplete-" + quest.id] = new Topic(quest.dialogue.completed, [
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ]);
            topics["questRefuse-" + quest.id] = new Topic(quest.dialogue.reject, [
                new Reply(this.questDialogue.pNewQuest, "questList"),
                new Reply(this.newTopic.pStart, "newTopic"),
                new Reply(this.general.pOutro, "goodbye")
            ])
        });
        return topics;
    }
}