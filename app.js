(() => {
  'use strict';

  const { roles, composePrompt } = globalThis.PromptComposer;
  const roleOptions = document.getElementById('roleOptions');
  const originalInput = document.getElementById('originalInput');
  const contextInput = document.getElementById('contextInput');
  const originalLabel = document.getElementById('originalLabel');
  const inputHint = document.getElementById('inputHint');
  const charCount = document.getElementById('charCount');
  const generateButton = document.getElementById('generateButton');
  const formMessage = document.getElementById('formMessage');
  const selectedRoleName = document.getElementById('selectedRoleName');
  const outputState = document.getElementById('outputState');
  const outputEmpty = document.getElementById('outputEmpty');
  const outputText = document.getElementById('outputText');
  const copyButton = document.getElementById('copyButton');
  const copyMessage = document.getElementById('copyMessage');

  const guidance = {
    structured: {
      label: '原始需求',
      hint: '写下你想交给 AI 的任务。简单的一句话也可以。',
      placeholder: '例如：帮我写一个能分析 AI 产品竞品的 Prompt……'
    },
    judge: {
      label: '待评估的 Prompt',
      hint: '粘贴现有 Prompt。评估与打分会由你使用的外部 AI 完成。',
      placeholder: '粘贴你想诊断的 Prompt，例如：你是产品分析师，请比较……'
    },
    crispe: {
      label: '待调优的 Prompt',
      hint: '粘贴要重构的 Prompt，保留原意并用 CRISPE 框架打磨。',
      placeholder: '粘贴你想用 CRISPE 框架优化的 Prompt……'
    }
  };

  function selectedRole() {
    return roleOptions.querySelector('input[name="role"]:checked').value;
  }

  function clearResult() {
    outputText.value = '';
    outputText.hidden = true;
    outputEmpty.hidden = false;
    copyButton.disabled = true;
    copyMessage.textContent = '';
    copyMessage.classList.remove('is-success');
    outputState.textContent = '等待生成';
  }

  roleOptions.addEventListener('change', () => {
    const roleId = selectedRole();
    const guide = guidance[roleId];
    selectedRoleName.textContent = roles[roleId].name;
    originalLabel.innerHTML = `${guide.label} <span>*</span>`;
    inputHint.textContent = guide.hint;
    originalInput.placeholder = guide.placeholder;
    formMessage.textContent = '';
    formMessage.classList.remove('is-success');
    clearResult();
  });

  for (const field of [originalInput, contextInput]) {
    field.addEventListener('input', () => {
      charCount.textContent = `${Array.from(originalInput.value).length} 字`;
      formMessage.textContent = '';
      formMessage.classList.remove('is-success');
      if (!outputText.hidden) clearResult();
    });
  }

  generateButton.addEventListener('click', () => {
    formMessage.textContent = '';
    copyMessage.textContent = '';
    try {
      const result = composePrompt(selectedRole(), originalInput.value, contextInput.value);
      outputText.value = result;
      outputText.hidden = false;
      outputEmpty.hidden = true;
      outputText.scrollTop = 0;
      copyButton.disabled = false;
      outputState.textContent = '已生成 · 待复制';
      formMessage.classList.add('is-success');
      formMessage.textContent = '指令已生成，请在结果区查看并复制。';
      if (window.matchMedia('(max-width: 680px)').matches) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById('output-title').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
      }
    } catch (error) {
      clearResult();
      formMessage.classList.remove('is-success');
      formMessage.textContent = error.message;
      originalInput.focus();
    }
  });

  copyButton.addEventListener('click', async () => {
    if (copyButton.disabled || !outputText.value) return;
    const text = outputText.value;
    let copied = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (_) {
        // file:// 页面或浏览器权限设置可能拒绝 Clipboard API。
      }
    }

    if (!copied) {
      outputText.focus();
      outputText.select();
      try {
        copied = document.execCommand('copy');
      } catch (_) {
        // 保留选区，供用户手动复制。
      }
    }

    copyMessage.classList.toggle('is-success', copied);
    copyMessage.textContent = copied ? '已复制。粘贴到你的 AI 工具中使用。' : '浏览器未允许自动复制；结果已选中，请按 Ctrl+C（Mac：⌘C）。';
    if (copied) outputState.textContent = '已复制';
  });
})();
