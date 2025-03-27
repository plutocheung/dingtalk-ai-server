import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from 'node-fetch';

// 钉钉应用凭证
const DINGTALK_APP_KEY = 'dingfy9izxqgyqj8pdrh';
const DINGTALK_APP_SECRET = '85-cR_dfrXuONPTotaUlMzEI0VBEOnL36KtreI8HzagY_4MWSf0lmw1UlxTgr85g';

// 获取访问令牌
async function getAccessToken() {
    try {
        const response = await fetch(
            `https://oapi.dingtalk.com/gettoken?appkey=${DINGTALK_APP_KEY}&appsecret=${DINGTALK_APP_SECRET}`
        );
        const data = await response.json();
        if (data.errcode === 0 && data.access_token) {
            return data.access_token;
        } else {
            throw new Error(`获取access_token失败: ${data.errmsg}`);
        }
    } catch (error) {
        throw new Error(`获取access_token时发生错误: ${error.message}`);
    }
}

// 添加服务启动日志
console.error('DingTalk Assistant Thread MCP 服务启动中...');

// 创建MCP服务器
const server = new McpServer({
    name: "DingTalk-Assistant-Thread",
    version: "1.0.0"
});

// 添加创建助手对话的工具
server.tool("createAssistantThread",
    {
        accessToken: z.string()
    },
    async ({ accessToken }) => {
        console.error('开始创建助手对话');
        try {
            console.error('正在调用钉钉创建助手对话接口...');
            // 调用创建助手对话接口
            const response = await fetch(
                'https://api.dingtalk.com/v1.0/assistant/threads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acs-dingtalk-access-token': accessToken,
                    'x-acs-dingtalk-version': '2.0'
                }
            });

            const responseData = await response.json();
            console.error('成功创建助手对话:', JSON.stringify(responseData, null, 2));
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(responseData, null, 2)
                }]
            };
        } catch (error) {
            console.error('创建助手对话失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 添加创建助手消息的工具
server.tool("createAssistantMessage",
    {
        accessToken: z.string(),
        threadId: z.string(),
        content: z.string(),
        messageType: z.enum(['text', 'image']).optional(),
        role: z.enum(['user', 'assistant']).optional()
    },
    async ({ accessToken, threadId, content, messageType = 'text', role = 'user' }) => {
        console.error('开始创建助手消息');
        try {
            const requestBody = {
                role: role,
                content: content.toString()
            };

            console.error('请求体:', JSON.stringify(requestBody, null, 2));
            console.error('正在调用钉钉创建助手消息接口...');
            const response = await fetch(
                `https://api.dingtalk.com/v1.0/assistant/threads/${threadId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acs-dingtalk-access-token': accessToken,
                    'x-acs-dingtalk-version': '2.0'
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = await response.json();
            console.error('响应数据:', JSON.stringify(responseData, null, 2));
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(responseData, null, 2)
                }]
            };
        } catch (error) {
            console.error('创建助手消息失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 添加获取访问凭证的工具
server.tool("getToken",
    {
        appKey: z.string(),
        appSecret: z.string()
    },
    async ({ appKey, appSecret }) => {
        console.error('开始获取访问凭证');
        try {
            const response = await fetch(
                `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.error('获取访问凭证结果:', JSON.stringify(data, null, 2));

            if (data.errcode === 0 && data.access_token) {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            access_token: data.access_token,
                            expires_in: data.expires_in
                        }, null, 2)
                    }]
                };
            } else {
                throw new Error(`获取access_token失败: ${data.errmsg}`);
            }
        } catch (error) {
            console.error('获取访问凭证失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 添加创建AI助理运行任务的工具
server.tool("createAssistantRun",
    {
        accessToken: z.string(),
        threadId: z.string(),
        assistantId: z.string(),
        instructions: z.string().optional(),
        metadata: z.record(z.any()).optional()
    },
    async ({ accessToken, threadId, assistantId, instructions, metadata }) => {
        console.error('开始创建AI助理运行任务');
        try {
            const requestBody = {
                assistantId,
                ...(instructions && { instructions }),
                ...(metadata && { metadata })
            };

            console.error('正在调用钉钉创建助理运行任务接口...');
            const response = await fetch(
                `https://api.dingtalk.com/v1.0/assistant/threads/${threadId}/runs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acs-dingtalk-access-token': accessToken,
                    'x-acs-dingtalk-version': '2.0'
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = await response.json();
            console.error('响应数据:', JSON.stringify(responseData, null, 2));
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(responseData, null, 2)
                }]
            };
        } catch (error) {
            console.error('创建助理运行任务失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 添加查询AI助理运行任务的工具
server.tool("getAssistantRun",
    {
        accessToken: z.string(),
        threadId: z.string(),
        runId: z.string()
    },
    async ({ accessToken, threadId, runId }) => {
        console.error('开始查询AI助理运行任务');
        try {
            console.error('正在调用钉钉查询助理运行任务接口...');
            const response = await fetch(
                `https://api.dingtalk.com/v1.0/assistant/threads/${threadId}/runs/${runId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acs-dingtalk-access-token': accessToken,
                    'x-acs-dingtalk-version': '2.0'
                }
            });

            const responseData = await response.json();
            console.error('响应数据:', JSON.stringify(responseData, null, 2));
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(responseData, null, 2)
                }]
            };
        } catch (error) {
            console.error('查询助理运行任务失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 添加发送通知消息的工具
server.tool("sendMessage",
    {
        accessToken: z.string(),
        userIds: z.array(z.string()),
        msgParam: z.record(z.any()),
        msgKey: z.string()
    },
    async ({ accessToken, userIds, msgParam, msgKey }) => {
        console.error('开始发送通知消息');
        try {
            const requestBody = {
                msg_param: typeof msgParam === 'string' ? msgParam : JSON.stringify(msgParam),
                msg_key: msgKey,
                to_user_ids: userIds
            };

            console.error('请求体:', JSON.stringify(requestBody, null, 2));
            console.error('正在调用钉钉发送工作通知接口...');
            const response = await fetch(
                'https://api.dingtalk.com/v1.0/im/v1.0/robot/interactiveCards/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acs-dingtalk-access-token': accessToken
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = await response.json();
            console.error('响应数据:', JSON.stringify(responseData, null, 2));
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(responseData, null, 2)
                }]
            };
        } catch (error) {
            console.error('发送通知消息失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 启动服务器
const transport = new StdioServerTransport();
console.error('正在连接MCP服务器...');

process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

await server.connect(transport).then(() => {
    console.error('MCP服务器连接成功！');
}).catch(error => {
    console.error('MCP服务器连接失败:', error);
});