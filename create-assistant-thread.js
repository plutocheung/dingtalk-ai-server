import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DINGTALK_APP_KEY = 'dingotzhpvguh9ke29fu';
const DINGTALK_APP_SECRET = 'ZjQSrvCQXZd8zBCUEZld8ntojb967hmF8mDKIlq3dl80mAS3XFRclJSgLtFjyLC2';

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
            throw new Error(`获取access_token失败: ${JSON.stringify(data)}`);
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
        accessToken: z.string().optional()
    },
    async ({ accessToken: providedToken }) => {
        console.error('开始创建助手对话');
        try {
            // 如果没有提供token，则获取新的token
            const accessToken = providedToken || await getAccessToken();
            
            if (!accessToken) {
                throw new Error("未能获取有效的访问令牌");
            }

            console.error('正在调用钉钉创建助手对话接口...');

            // 调用创建助手对话接口
            const response = await fetch(
                'https://api.dingtalk.com/v1.0/assistant/threads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acs-dingtalk-access-token': accessToken,
                    'x-acs-dingtalk-version': '1.0'
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