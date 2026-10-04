"""Submit a local ComfyUI API-format task. Does not install or run external code."""
import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='向本机 ComfyUI 提交一份 API 工作流')
    parser.add_argument('workflow', type=Path)
    parser.add_argument('--server', default='http://127.0.0.1:8188')
    args = parser.parse_args()
    server = urllib.parse.urlparse(args.server)
    if server.scheme != 'http' or server.hostname not in ('127.0.0.1','localhost','::1') or server.username or server.password or server.query or server.fragment:
        parser.error('--server 只能是本机 HTTP 地址，例如 http://127.0.0.1:8188')
    try:
        workflow=json.loads(args.workflow.read_text(encoding='utf-8-sig'))
        if not isinstance(workflow,dict) or not workflow or any(not isinstance(node,dict) or 'class_type' not in node or 'inputs' not in node for node in workflow.values()):
            raise ValueError('需要 API 格式的节点字典，不是可视化工程 JSON')
        request=urllib.request.Request(args.server.rstrip('/')+'/prompt',json.dumps({'prompt':workflow}).encode('utf-8'),{'Content-Type':'application/json'})
        with urllib.request.urlopen(request,timeout=30) as response:
            result=json.load(response)
        if not result.get('prompt_id') or result.get('node_errors'):
            raise ValueError('ComfyUI 未接受任务：'+json.dumps(result,ensure_ascii=False))
        print('任务已入队：'+result['prompt_id'])
        print('请在 ComfyUI 中等待执行并查看结果；入队不代表生图已完成。')
    except (OSError,ValueError,urllib.error.URLError) as exc:
        print('提交失败：'+str(exc),file=sys.stderr)
        return 1
    return 0

if __name__=='__main__':
    sys.exit(main())
