# deepseek-engram-moni
deepseek-engram-moni
这份代码已经非常接近工业级研究原型的水准。为了让这个项目看起来更专业，我为你撰写了一份 **README.md**。它不仅解释了代码如何运行，还从架构师的角度阐述了 **MLA**、**MoE** 和 **MTP** 的设计哲学。

---

# DeepSeek-V4-Ultra (Lite Implementation)

这是一个基于 PyTorch 实现的 **DeepSeek-V4** 核心架构高度精简版。本项目旨在演示现代大语言模型（LLM）中通过 **低秩压缩注意力 (MLA)**、**细粒度专家混合 (MoE)** 以及 **多 Token 预测 (MTP)** 实现的高性能架构方案。

## 🌟 核心特性

本项目集成了 DeepSeek 系列模型最引人注目的技术突破：

* **MLA (Multi-head Latent Attention)**:
* 通过低秩向量压缩 KV 缓存（KV Cache），显著降低推理时的显存占用。
* 解耦旋转位置编码（RoPE），在压缩状态下保持精确的位置感知。


* **DeepSeekMoE (Fine-grained Mixture of Experts)**:
* **共享专家 (Shared Experts)**：捕获序列中的通用知识。
* **路由专家 (Routed Experts)**：针对特定领域知识进行专家化分工。
* **辅助损失 (Auxiliary Loss)**：内置负载均衡机制，防止专家退化。


* **MTP (Multi-Token Prediction)**:
* 不同于传统的逐词预测（Next Token Prediction），模型支持多步并行预测（Predicting ），加速训练收敛并提升生成一致性。


* **Dynamic Engram (CPU-Offloaded Memory)**:
* 模拟海量外部知识库检索，将 Key/Value 存储在 CPU 内存中，仅在计算时提取至 GPU，实现“无限长度”记忆的可能。



## 🏗️ 系统架构

模型通过 `DeepSeekBlock` 进行堆叠，逻辑流程如下：

1. **输入层**：Token Embedding + **Dynamic Engram**（仅在前几层进行知识注入）。
2. **注意力层**：执行 **MLA** 计算，并应用 **RoPE** 旋转位置编码与因果掩码。
3. **专家层**：通过 Router 将输入分发至 Top-K 专家，结合共享专家输出。
4. **预测头**：输出主预测 Logits，并由 **MTP Head** 递归生成未来步长的 Logits。

## 🚀 快速开始

### 环境依赖

* Python 3.10+
* PyTorch 2.0+ (支持 CUDA)

### 运行 Demo

直接运行主脚本即可验证前向传播与 Loss 计算逻辑：

```bash
python main.py
python test.py
```

## ⚙️ 关键配置说明

在 `UltraConfig` 类中，你可以调整以下参数以适配你的硬件：

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `hidden_size` | 模型隐藏层维度 | 512 |
| `n_layers` | Transformer 层数 | 8 |
| `n_experts` | MoE 总专家数 | 16 |
| `engram_layers` | 指定注入外部记忆的层索引 | [0] |
| `mtp_depth` | MTP 并行预测的深度 | 2 |

## ⚠️ 注意事项

1. **内存管理**：`Dynamic Engram` 默认初始化了 10,000 条随机向量存储在 CPU。如果显存报错，请确保 `device` 正确识别。
2. **因果掩码**：模型内置了严格的 `torch.triu` 因果掩码，确保训练过程中不会发生“未来信息泄露”。
3. **损失函数**：最终 Loss 由 `Main_CE + MTP_CE + Aux_Loss` 三部分组成，这对于 MoE 的稳定训练至关重要。



你可以尝试在训练循环中通过 `MTP` 的输出进行辅助监督，这通常能显著提升模型对长上下文的理解能力。

**需要我帮你写一个基于此 README 的简单训练脚本（Trainer）示例吗？**
