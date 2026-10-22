export type FeedbackInput={rating:string;stuck:string;wish:string};
export type FeedbackMode='not_used'|'rules'|'deepseek';
export type FeedbackPayload=FeedbackInput&{submissionId:string;mode:FeedbackMode};
const secretPattern=/(?:sk-[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]+|-----BEGIN[^\n]*PRIVATE KEY-----)/;
export function makeFeedbackPayload(input:FeedbackInput,mode:FeedbackMode,submissionId:string):FeedbackPayload{
 const rating=input.rating.trim(),stuck=input.stuck.trim(),wish=input.wish.trim();
 if(!['','有帮助','有一点','暂时没有'].includes(rating))throw new Error('请选择有效的评价。');
 if(!rating&&!stuck&&!wish)throw new Error('请先选择一个评价，或写下一点建议。');
 if(stuck.length>800||wish.length>800)throw new Error('每项反馈请控制在800字以内。');
 if(secretPattern.test(stuck+'\n'+wish))throw new Error('反馈中似乎包含密钥，请移除后再提交。');
 return {submissionId,rating,stuck,wish,mode};
}
export async function uploadFeedback(config:{url:string;publishableKey:string},payload:FeedbackPayload):Promise<{id:string;receivedAt:string}>{
 if(!config.url||!config.publishableKey)throw new Error('反馈接收服务尚未启用，内容已保留在当前页面，请稍后再试。');
 const endpoint=new URL('/rest/v1/rpc/submit_feedback',config.url);
 if(endpoint.protocol!=='https:')throw new Error('反馈服务地址无效。');
 // Rebuild the payload to ensure personal descriptions and API keys never get attached.
 const safe=makeFeedbackPayload(payload,payload.mode,payload.submissionId);
 let response:Response;
 try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:config.publishableKey},body:JSON.stringify({payload:safe}),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)})}
 catch{throw new Error('未能确认反馈是否保存。内容仍在，请稍后重试；相同反馈重试不会重复保存。')}
 if(!response.ok)throw new Error(response.status===429?'提交太频繁，请稍后再试。':'服务器未确认保存成功，内容已保留，请稍后重试。');
 let receipt:unknown;try{receipt=await response.json()}catch{throw new Error('未收到有效的保存回执，请稍后重试。')}
 const r=receipt as {ok?:boolean;id?:string;receivedAt?:string};
 if(r?.ok!==true||r.id!==safe.submissionId||typeof r.receivedAt!=='string'||Number.isNaN(Date.parse(r.receivedAt)))throw new Error('未收到有效的保存回执，请稍后重试。');
 return {id:r.id,receivedAt:r.receivedAt};
}
