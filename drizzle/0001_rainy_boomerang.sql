CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"photo_url" text,
	"provider" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
