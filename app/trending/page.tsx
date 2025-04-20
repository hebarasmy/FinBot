"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const NEWS_API_KEY = "025d1e9c77374f8093ef9b5883894fea";
const API_URL = `https://newsapi.org/v2/top-headlines?category=business&apiKey=${NEWS_API_KEY}`;

const filters = ["Stock", "Market", "NASDAQ", "Dow Jones", "S&P", "Equities", "Investing", "Crypto", "Bitcoin", "Ethereum", "Blockchain", "Finance", "Economy", "GDP", "Inflation", "Artificial Intelligence", "AI", "Machine Learning", "Deep Learning"];

interface Article {
  source: { name: string };
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
}

export default function TrendingPage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("API Response:", data);

        if (!data.articles || !Array.isArray(data.articles)) {
          console.error("Unexpected API response structure", data);
          return;
        }

        const filteredArticles = data.articles
          .filter((article: Article) =>
            article.description && // Ensure description exists
            filters.some((kw) => article.title?.toLowerCase().includes(kw.toLowerCase()))
          )
          .slice(0, 10); // Limit to 10 articles

        console.log("Filtered articles:", filteredArticles.length);
        setArticles(filteredArticles);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    }
    fetchNews();
  }, []);

  return (
    <div className="flex-1 bg-[#f5f6fa] min-h-screen overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 h-screen overflow-y-scroll">
        <h2 className="text-2xl font-bold mb-4">Trending Financial News</h2>
        <div className="space-y-4">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <Card key={index} className="p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {article.urlToImage && (
                    <img src={article.urlToImage} alt="News Thumbnail" className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-[#05112a]">{article.title}</h3>
                      <Button className="bg-[#6F96B4] hover:bg-[#6F96B4]/90">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          Visit <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <p className="text-[#7c7c7c] mt-2 line-clamp-2">{article.description}</p>
                    <div className="mt-2">
                      <span className="text-sm text-[#7c7c7c]">Source:</span>
                      <span className="text-sm text-[#05112a] ml-1">{article.source.name}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500">No articles found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
