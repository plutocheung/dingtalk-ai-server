import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 初始化环境变量
dotenv.config();

// 添加服务启动日志
console.error('DingTalk Token MCP 服务启动中...');

let inputData = '';
process.stdin.on('data', chunk => {
    inputData += chunk;
});

process.stdin.on('end', async () => {
    console.error('收到输入数据:', inputData);
    try {
        const request = JSON.parse(inputData);
        console.error('解析后的请求:', request);
        
        if (request.type === 'tool' && request.name === 'getToken') {
            const { appKey, appSecret } = request.parameters;
            const token = await getAccessToken(appKey, appSecret);
            
            console.log(JSON.stringify({
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        access_token: token,
                        expires_in: 7200
                    }, null, 2)
                }]
            }));
        }
    } catch (error) {
        console.error('处理请求时出错:', error);
        console.log(JSON.stringify({
            content: [{
                type: "text",
                text: `错误: ${error.message}`
            }]
        }));
    }
});

// 定义获取访问令牌的函数
async function getAccessToken(appKey, appSecret) {
    console.error('正在获取访问令牌...');
    const url = `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.error('成功获取访问令牌:', data);
        return data.access_token;
    } catch (error) {
        console.error('获取访问令牌失败:', error);
        throw error;
    }
}

// 创建MCP服务器
const server = new McpServer({
    name: "DingTalk-Token",
    version: "1.0.0"
});

// 添加获取token的工具
server.tool("getToken",
    {
        appKey: z.string(),
        appSecret: z.string()
    },
    async ({ appKey, appSecret }) => {
        try {
            const token = await getAccessToken(appKey, appSecret);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        access_token: token,
                        expires_in: 7200
                    }, null, 2)
                }]
            };
        } catch (error) {
            console.error('获取Token失败:', error);
            return {
                content: [{
                    type: "text",
                    text: `错误: ${error.message}`
                }]
            };
        }
    }
);

// 添加token资源模板
server.resource(
    "token",
    new ResourceTemplate("token://get", { list: undefined }),
    async (uri) => {
        try {
            const appKey = process.env.DINGTALK_APP_KEY;
            const appSecret = process.env.DINGTALK_APP_SECRET;
            
            if (!appKey || !appSecret) {
                throw new Error("未设置钉钉应用凭证 DINGTALK_APP_KEY 或 DINGTALK_APP_SECRET");
            }

            const token = await getAccessToken(appKey, appSecret);
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({
                        access_token: token,
                        expires_in: 7200
                    }, null, 2)
                }]
            };
        } catch (error) {
            return {
                contents: [{
                    uri: uri.href,
                    text: `Error: ${error.message}`
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