
const router = require('express').Router();

const Category = require('../models/Category');
const Insight = require('../models/Insight');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);


// Keyword fallback categorizer



function keywordCategorize(text, categories) {
  const value = text.toLowerCase();

  const rules = [
    {
      keywords: [
        'food',
        'eat',
        'lunch',
        'dinner',
        'breakfast',
        'restaurant',
        'cafe',
        'chicken',
        'pizza',
        'rice',
        'meal',
        'drinks',
        'snack',
        'grocery',
        'groceries',
        'supermarket',
      ],
      categoryNames: ['Food & Drinks', 'Food'],
    },

    {
      keywords: [
        'uber',
        'bolt',
        'taxi',
        'bus',
        'transport',
        'fare',
        'fuel',
        'diesel',
        'ride',
        'train',
      ],
      categoryNames: ['Transport'],
    },

    {
      keywords: [
        'school',
        'course',
        'tuition',
        'books',
        'education',
        'training',
        'exam',
        'lecture',
        'study',
      ],
      categoryNames: ['Education'],
    },

    {
      keywords: [
        'rent',
        'hostel',
        'apartment',
        'accommodation',
        'landlord',
        'lodge',
      ],
      categoryNames: ['Housing'],
    },

    {
      keywords: [
        'doctor',
        'hospital',
        'medicine',
        'pharmacy',
        'clinic',
        'drug',
      ],
      categoryNames: ['Healthcare'],
    },

    {
      keywords: [
        'shirt',
        'clothes',
        'clothing',
        'shoes',
        'store',
        'mall',
        'amazon',
        'jumia',
        'konga',
        'fashion',
        'buy',
        'purchase',
      ],
      categoryNames: ['Shopping'],
    },

    {
      keywords: [
        'movie',
        'cinema',
        'game',
        'concert',
        'entertainment',
        'netflix',
        'spotify',
        'streaming',
      ],
      categoryNames: ['Entertainment'],
    },

    {
      keywords: [
        'electricity',
        'water',
        'internet',
        'wifi',
        'data',
        'airtime',
        'utilities',
        'bill',
      ],
      categoryNames: ['Utilities'],
    },

    {
      keywords: [
        'save',
        'savings',
        'investment',
        'piggy',
      ],
      categoryNames: ['Savings'],
    },
  ];

  for (const rule of rules) {
    const matched = rule.keywords.some((keyword) =>
      value.includes(keyword)
    );

    if (matched) {
      const category = categories.find((cat) =>
        rule.categoryNames.some(
          (name) => cat.name.toLowerCase() === name.toLowerCase()
        )
      );

      if (category) {
        return {
          categoryId: category._id.toString(),
          categoryName: category.name,
          confidence: 0.75,
          source: 'keyword-fallback',
        };
      }
    }
  }

  const otherCategory = categories.find(
    (cat) => cat.name.toLowerCase() === 'other'
  );

  if (otherCategory) {
    return {
      categoryId: otherCategory._id.toString(),
      categoryName: otherCategory.name,
      confidence: 0.4,
      source: 'keyword-fallback',
    };
  }

  return null;
}


//POST /ai/categorize

router.post('/categorize', async (req, res) => {
  try {
    const { description = '', merchant = '' } = req.body;

    if (!description && !merchant) {
      return res.status(400).json({
        message: 'description or merchant is required',
      });
    }

    
     //Only expense categories should be suggested for an expense
      //transaction.
    
    const categories = await Category.find({
      type: 'expense',
      $or: [
        { userId: req.user._id },
        { userId: null, isDefault: true },
      ],
    }).select('_id name type');

    const text = `${description} ${merchant}`.trim();

    
     // OpenAI path
     
     // OpenAI is optional.
     // If OPENAI_API_KEY is missing, we simply use the fallback.
     
    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import('openai');

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const categoryList = categories
          .map((category) => `${category._id} (${category.name})`)
          .join('\n');

        const prompt = [
          'You are a PF transaction categorization assistant.',
          'Choose the single best expense category from the provided list.',
          'Reply with ONLY the category ID.',
          '',
          `Description: ${description}`,
          `Merchant: ${merchant}`,
          '',
          'Available expense categories:',
          categoryList,
        ].join('\n');

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 50,
          temperature: 0,
        });

        const rawId =
          completion.choices[0]?.message?.content?.trim();

        const matched = categories.find(
          (category) => category._id.toString() === rawId
        );

        if (matched) {
          return res.json({
            data: {
              description,
              merchant,
              categoryId: matched._id.toString(),
              categoryName: matched.name,
              confidence: 0.9,
              source: 'openai',
            },
          });
        }

        console.warn(
          'OpenAI returned an invalid category ID. Using keyword fallback.'
        );
      } catch (aiErr) {
        console.warn(
          'OpenAI categorize failed, using keyword fallback:',
          aiErr.message
        );
      }
    }

    /*
     * ---------------------------------------------------------------
     * Keyword fallback
     * ---------------------------------------------------------------
     */
    const result = keywordCategorize(text, categories);

    if (!result) {
      return res.status(404).json({
        message: 'No suitable expense category found',
      });
    }

    return res.json({
      data: {
        description,
        merchant,
        ...result,
      },
    });
  } catch (err) {
    console.error('AI categorize error:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
});


//POST /ai/insights/generate

//monthly financial insight.

//OpenAI is optional.
// If OpenAI is unavailable, the rule-based insight is used.

router.post('/insights/generate', async (req, res) => {
  try {
    const { month } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: 'month is required in YYYY-MM format',
      });
    }

    const userId = req.user._id;

    const [year, mon] = month.split('-').map(Number);

    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const transactions = await Transaction.find({
      userId,
      occurredAt: {
        $gte: start,
        $lt: end,
      },
    });

    /*
     * Calculate monthly totals.
     */
    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const netSavings = totalIncome - totalExpense;

    const savingsRate =
      totalIncome > 0
        ? (netSavings / totalIncome) * 100
        : 0;

    let insightTitle = '';
    let insightBody = '';
    let isAiGenerated = false;

    
     // OpenAI insight generation
     
    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import('openai');

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = [
          'You are a PF assistant helping a university student.',
          `Generate a short financial insight for ${month}.`,
          `Total income: ₦${totalIncome.toLocaleString()}`,
          `Total expenses: ₦${totalExpense.toLocaleString()}`,
          `Net savings: ₦${netSavings.toLocaleString()}`,
          `Savings rate: ${savingsRate.toFixed(1)}%`,
          '',
          'Make the advice specific, practical and encouraging.',
          'Keep it to 2 or 3 sentences.',
          'Do not use markdown.',
          'Return JSON only in this format:',
          '{"title":"...","body":"..."}',
        ].join('\n');

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        });

        const raw =
          completion.choices[0]?.message?.content?.trim() || '';

        
         //Remove accidental markdown code fences if the model
         // returns them.
         
        const cleaned = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        if (parsed.title && parsed.body) {
          insightTitle = parsed.title;
          insightBody = parsed.body;
          isAiGenerated = true;
        }
      } catch (aiErr) {
        console.warn(
          'OpenAI insight failed, using rule-based insight:',
          aiErr.message
        );
      }
    }

   
    
     // Rule-based fallback
     
    if (!insightTitle) {
      if (transactions.length === 0) {
        insightTitle = 'No transactions recorded';

        insightBody =
          `You have no transactions logged for ${month}. ` +
          'Start tracking your income and expenses to get personalized insights.';
      } else if (savingsRate >= 20) {
        insightTitle = 'Great savings rate!';

        insightBody =
          `You saved ${savingsRate.toFixed(0)}% of your income in ${month} ` +
          `— that's ₦${netSavings.toLocaleString()}. ` +
          'Keep it up and consider putting some aside in a dedicated savings account.';
      } else if (savingsRate > 0) {
        insightTitle = 'Room to save more';

        insightBody =
          `You saved ${savingsRate.toFixed(0)}% of your income in ${month}. ` +
          'Try reducing your top expense category by 10% next month to boost your savings.';
      } else if (netSavings < 0) {
        insightTitle = 'Expenses exceeded income';

        insightBody =
          `You spent ₦${Math.abs(netSavings).toLocaleString()} more than you earned in ${month}. ` +
          'Review your largest expense categories and look for areas to cut back.';
      } else {
        insightTitle = `Monthly summary for ${month}`;

        insightBody =
          `Income: ₦${totalIncome.toLocaleString()} · ` +
          `Expenses: ₦${totalExpense.toLocaleString()} · ` +
          `Net: ₦${netSavings.toLocaleString()}.`;
      }
    }

    // Save/update insight
     
   
    const insight = await Insight.findOneAndUpdate(
      {
        userId,
        month,
        kind: 'monthly-summary',
      },
      {
        $set: {
          userId,
          month,
          kind: 'monthly-summary',
          title: insightTitle,
          body: insightBody,
          isAiGenerated,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return res.status(201).json({
      data: {
        insightId: insight._id.toString(),
        month,
        title: insight.title,
        body: insight.body,
        isAiGenerated: insight.isAiGenerated,
      },
    });
  } catch (err) {
    console.error('AI insights/generate error:', err);

    return res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;

