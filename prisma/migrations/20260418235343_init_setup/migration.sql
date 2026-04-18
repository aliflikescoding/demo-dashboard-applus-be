-- CreateTable
CREATE TABLE "person" (
    "id" UUID NOT NULL,
    "nik" VARCHAR(16),
    "passport_number" VARCHAR(9),
    "name" VARCHAR(50) NOT NULL,
    "npwp" VARCHAR(16) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_contract" (
    "work_contract_number" TEXT NOT NULL,
    "person_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "job_title" VARCHAR(40) NOT NULL,
    "job_type" VARCHAR(4) NOT NULL DEFAULT 'year',
    "job_year" INTEGER,
    "contract_type" VARCHAR(5) NOT NULL DEFAULT 'hour',
    "salary_month" INTEGER,
    "salary_hour" INTEGER,
    "leave" INTEGER NOT NULL,
    "sick_leave" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "work_contract_pkey" PRIMARY KEY ("work_contract_number")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_nik_key" ON "person"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "person_passport_number_key" ON "person"("passport_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "work_contract" ADD CONSTRAINT "work_contract_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
